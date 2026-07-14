#!/usr/bin/env npx tsx
import { generateReport } from "./report";

const report = generateReport();
process.stdout.write(report + "\n");