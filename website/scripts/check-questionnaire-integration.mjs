import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { envOrDefault, getAppDir, loadEnvFiles, requiredEnv } from "./lib/env.mjs";

const appDir = getAppDir(import.meta.url);
const repoDir = path.resolve(appDir, "..");
const env = loadEnvFiles(appDir);

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", env);
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY", env);
const version = envOrDefault("QUESTIONNAIRE_VERSION", "launch-v1", env);
const supportedTypes = new Set([
  "text",
  "textarea",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "scale",
  "matrix_pair"
]);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data: rows, error } = await supabase
  .from("questionnaire_questions")
  .select("code,section_id,section_title,section_order,order_index,question_text,question_type,is_required,is_active,options,required_when,metadata")
  .eq("questionnaire_version", version)
  .eq("is_active", true)
  .order("section_order", { ascending: true })
  .order("order_index", { ascending: true })
  .order("code", { ascending: true });

if (error) {
  throw new Error(`Gagal membaca pertanyaan aktif: ${error.message}`);
}

const issues = [];
const warnings = [];
const activeRows = rows ?? [];
const androidVersion = readAndroidQuestionnaireVersion();

if (androidVersion && androidVersion !== version) {
  issues.push(`Versi Android (${androidVersion}) berbeda dari versi remote (${version})`);
}

if (activeRows.length === 0) {
  issues.push(`Tidak ada pertanyaan aktif untuk versi ${version}`);
}

validateAndroidMapperReferences();
validateQuestionRows(activeRows);

const typeCounts = countBy(activeRows, (row) => row.question_type);
const sectionCounts = countBy(activeRows, (row) => `${row.section_order}. ${row.section_title || row.section_id}`);

if (issues.length > 0) {
  printSummary("Questionnaire integration FAILED", activeRows, typeCounts, sectionCounts, warnings, issues);
  process.exit(1);
}

printSummary("Questionnaire integration OK", activeRows, typeCounts, sectionCounts, warnings, issues);

function validateQuestionRows(questionRows) {
  const codes = new Set();
  const sectionOrders = new Map();

  questionRows.forEach((row, index) => {
    const label = row.code || `row-${index + 1}`;
    if (!row.code) issues.push(`Baris ${index + 1} tidak punya code`);
    if (codes.has(row.code)) issues.push(`Code duplikat: ${row.code}`);
    codes.add(row.code);

    if (!row.section_id) issues.push(`${label}: section_id kosong`);
    if (!row.section_title) warnings.push(`${label}: section_title kosong, Android akan memakai section_id`);
    if (!Number.isInteger(row.section_order)) issues.push(`${label}: section_order harus integer`);
    if (!Number.isInteger(row.order_index)) issues.push(`${label}: order_index harus integer`);
    if (!row.question_text?.trim()) issues.push(`${label}: question_text kosong`);
    if (!supportedTypes.has(row.question_type)) issues.push(`${label}: tipe ${row.question_type} belum didukung Android`);

    if (sectionOrders.has(row.section_id) && sectionOrders.get(row.section_id) !== row.section_order) {
      issues.push(`${label}: section_id ${row.section_id} punya section_order tidak konsisten`);
    }
    sectionOrders.set(row.section_id, row.section_order);

    validateOptions(label, row.question_type, row.options);
    validateRequiredWhen(label, row.required_when, codes);
  });
}

function validateOptions(label, questionType, options) {
  if (["single_choice", "scale"].includes(questionType)) {
    if (!Array.isArray(options) || options.length === 0) {
      issues.push(`${label}: ${questionType} wajib punya options array`);
      return;
    }
    options.forEach((option, index) => {
      if (!option?.value?.toString().trim()) issues.push(`${label}: option ${index + 1} tidak punya value`);
      if (!option?.label?.toString().trim()) issues.push(`${label}: option ${index + 1} tidak punya label`);
    });
    return;
  }

  if (questionType === "multi_choice") {
    if (!Array.isArray(options) || options.length === 0) {
      issues.push(`${label}: multi_choice wajib punya options array`);
      return;
    }
    options.forEach((option, index) => {
      if (!option?.field?.toString().trim()) issues.push(`${label}: option ${index + 1} tidak punya field`);
      if (!option?.label?.toString().trim()) issues.push(`${label}: option ${index + 1} tidak punya label`);
    });
    return;
  }

  if (questionType === "matrix_pair") {
    if (!options || Array.isArray(options) || typeof options !== "object") {
      issues.push(`${label}: matrix_pair wajib memakai options object`);
      return;
    }
    if (!Array.isArray(options.scale) || options.scale.length === 0) {
      issues.push(`${label}: matrix_pair wajib punya scale`);
    }
    if (!Array.isArray(options.rows) || options.rows.length === 0) {
      issues.push(`${label}: matrix_pair wajib punya rows`);
      return;
    }
    options.rows.forEach((row, index) => {
      if (!row?.label?.toString().trim()) issues.push(`${label}: matrix row ${index + 1} tidak punya label`);
      if (!row?.leftField?.toString().trim()) issues.push(`${label}: matrix row ${index + 1} tidak punya leftField`);
      if (!row?.rightField?.toString().trim()) issues.push(`${label}: matrix row ${index + 1} tidak punya rightField`);
    });
  }
}

function validateRequiredWhen(label, requiredWhen) {
  if (!requiredWhen) return;
  if (Array.isArray(requiredWhen) || typeof requiredWhen !== "object") {
    issues.push(`${label}: required_when harus object`);
    return;
  }
  if (!requiredWhen.field?.toString().trim()) issues.push(`${label}: required_when.field kosong`);
  if (!Array.isArray(requiredWhen.values) || requiredWhen.values.length === 0) {
    issues.push(`${label}: required_when.values kosong`);
  }
}

function validateAndroidMapperReferences() {
  const mapperPath = path.join(
    repoDir,
    "android",
    "app",
    "src",
    "main",
    "java",
    "com",
    "unihaz",
    "tracerstudy",
    "presentation",
    "tracerstudy",
    "RemoteQuestionnaireMapper.kt"
  );
  if (!fs.existsSync(mapperPath)) {
    issues.push("RemoteQuestionnaireMapper.kt tidak ditemukan");
    return;
  }

  const mapperSource = fs.readFileSync(mapperPath, "utf8");
  for (const type of supportedTypes) {
    if (!mapperSource.includes(`"${type}"`)) {
      issues.push(`RemoteQuestionnaireMapper Android belum memetakan tipe ${type}`);
    }
  }
}

function readAndroidQuestionnaireVersion() {
  const catalogPath = path.join(
    repoDir,
    "android",
    "app",
    "src",
    "main",
    "java",
    "com",
    "unihaz",
    "tracerstudy",
    "presentation",
    "tracerstudy",
    "QuestionnaireCatalog.kt"
  );
  if (!fs.existsSync(catalogPath)) return null;
  const match = fs.readFileSync(catalogPath, "utf8").match(/const val VERSION = "([^"]+)"/);
  return match?.[1] ?? null;
}

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function printSummary(title, questionRows, typeCounts, sectionCounts, summaryWarnings, summaryIssues) {
  console.log(title);
  console.log(`Version: ${version}`);
  console.log(`Active questions: ${questionRows.length}`);
  console.log(`Android questionnaire version: ${androidVersion ?? "-"}`);
  console.log("Types:");
  for (const [type, count] of typeCounts.entries()) console.log(`- ${type}: ${count}`);
  console.log("Sections:");
  for (const [section, count] of sectionCounts.entries()) console.log(`- ${section}: ${count}`);
  if (summaryWarnings.length > 0) {
    console.log("Warnings:");
    summaryWarnings.forEach((warning) => console.log(`- ${warning}`));
  }
  if (summaryIssues.length > 0) {
    console.log("Issues:");
    summaryIssues.forEach((issue) => console.log(`- ${issue}`));
  }
}
