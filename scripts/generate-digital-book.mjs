import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "assets", "digital", "field-notes-for-deep-reading.pdf");
fs.mkdirSync(path.dirname(output), { recursive: true });

const doc = new PDFDocument({ size: "A5", margins: { top: 48, bottom: 48, left: 48, right: 48 }, info: { Title: "Field Notes for Deep Reading", Author: "Quiet Shelf Books", Subject: "An original practical reading workbook" } });
doc.pipe(fs.createWriteStream(output));

const forest = "#244638";
const rust = "#A24C2A";
const muted = "#555B57";
function heading(text) { doc.moveDown(1.4).fillColor(forest).font("Times-Bold").fontSize(21).text(text).moveDown(.5); }
function body(text) { doc.fillColor("#202823").font("Helvetica").fontSize(10.5).text(text, { lineGap: 4 }).moveDown(.8); }
function prompt(text) { doc.fillColor(rust).font("Helvetica-Bold").fontSize(10).text(text).moveDown(.5); doc.strokeColor("#D9D0C1").moveTo(48, doc.y).lineTo(372, doc.y).stroke(); doc.moveDown(1.6); }
function newPage() { doc.addPage(); doc.fillColor(muted).font("Helvetica").fontSize(8).text("QUIET SHELF · FIELD NOTES", { align: "right" }); }

doc.rect(0, 0, 420, 595).fill(forest);
doc.fillColor("white").font("Helvetica").fontSize(9).text("QUIET SHELF BOOKS", 48, 64, { characterSpacing: 2 });
doc.font("Times-Bold").fontSize(36).text("Field Notes\nfor Deep Reading", 48, 175, { lineGap: 5 });
doc.fillColor("#D9E2DB").font("Helvetica").fontSize(12).text("A practical workbook for patient, memorable reading", 48, 305, { width: 300, lineGap: 5 });
doc.fillColor("white").fontSize(9).text("Original digital edition · 2026", 48, 500);

newPage(); heading("A note before you begin");
body("Deep reading is not a test of endurance. It is the practice of making enough room for a book to alter a question, complicate an opinion, or give language to something you had only sensed.");
body("This field guide offers small rituals and reusable pages. Use what helps. Leave what does not. The aim is not to finish more books, but to meet the books you choose with greater attention.");
prompt("What would make your reading time feel well spent this month?");

heading("1. Prepare the threshold");
body("Every reading session has a threshold: the short interval in which you move from the demands of the day into the world of the book. Make this transition visible. Put the phone beyond reach, place a pencil beside the page, and decide how long you will stay before you begin.");
body("A useful threshold can be as short as twenty minutes. Consistency matters more than duration.");
prompt("Where will you read, and what will you remove from that space?");
prompt("Write a modest promise for your next three sessions.");

newPage(); heading("2. Read with a live question");
body("Before opening the book, write one question you genuinely want it to help you explore. The question can change. Its purpose is to give your attention a shape without turning reading into a hunt for a single answer.");
body("Examples: What does this character refuse to see? What kind of evidence would change the author's conclusion? Why does this image keep returning?");
prompt("My live question for this book is…");
prompt("After fifty pages, the question has changed in this way…");

heading("3. Mark less, remember more");
body("A page covered in marks can hide what mattered. Try three signals only: a line for a claim, a circle for a recurring image or term, and a question mark where your understanding breaks down. At the end of a chapter, choose a single passage worth carrying forward.");
prompt("The one passage I would save from this chapter is…");
prompt("It matters because…");

newPage(); heading("4. The five-minute close");
body("Do not end a session at the final sentence you read. Spend five minutes closing the loop. Without looking back, write what moved, what remains uncertain, and where you will resume. This small act turns a sequence of pages into a remembered encounter.");
prompt("What moved in this section?");
prompt("What remains uncertain?");
prompt("Where will I resume, and what should I notice next?");

heading("5. A weekly reading log");
body("Use one line for each session. Keep the record light enough that it supports reading rather than replacing it.");
for (let i = 0; i < 6; i++) prompt("Date · pages · one-sentence trace");

newPage(); heading("6. Finish without closing");
body("When you finish, resist the immediate verdict. Instead, describe the book's movement, name one idea you want to test elsewhere, and choose whether the book deserves a second encounter. A book can be flawed and still useful; beloved and still unfinished in you.");
prompt("In three sentences, this book moved from… to…");
prompt("One idea I want to carry into another book or conversation…");
prompt("What I would look for on a rereading…");

heading("A final invitation");
body("Return to these pages whenever reading begins to feel like another stream to keep up with. Attention is not a fixed possession. It is a relationship you can rebuild, one deliberate encounter at a time.");
doc.moveDown(2).fillColor(rust).font("Times-Italic").fontSize(13).text("Read slowly enough to notice what changes.", { align: "center" });

doc.end();
console.log(`Generated ${path.relative(root, output)}`);
