const fs = require('fs');
const path = require('path');

function parseCsv(content) {
  const rows = content
    .trim()
    .split(/\r?\n/)
    .map(line => line.split(',').map(cell => cell.trim()));

  const headers = rows.shift();
  return rows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      const numeric = Number(value);
      item[header] = Number.isNaN(numeric) ? value : numeric;
    });
    return item;
  });
}

function summarizeColumn(values) {
  const numericValues = values.filter(v => typeof v === 'number');
  if (!numericValues.length) {
    return {
      count: values.length,
      type: 'non-numeric',
      unique: [...new Set(values)].length,
    };
  }

  const sorted = numericValues.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2 === 1
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = sorted.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / sorted.length;
  const stddev = Math.sqrt(variance);

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    sum,
    mean,
    median,
    stddev,
  };
}

function describeData(data) {
  if (!Array.isArray(data) || !data.length) {
    console.log('No data to analyze.');
    return;
  }

  const columns = Object.keys(data[0]);
  const summary = {};

  columns.forEach(column => {
    const values = data.map(row => row[column]);
    summary[column] = summarizeColumn(values);
  });

  console.log(JSON.stringify({ rows: data.length, summary }, null, 2));
}

function main() {
  const csvFile = process.argv[2] || 'data.csv';
  const filePath = path.resolve(csvFile);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error('Create a CSV file and run: node analytics.js your-data.csv');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = parseCsv(fileContent);
  describeData(data);
}

if (require.main === module) {
  main();
}
