function myFunction() {}

type ResultByPlayer = {
  name: string;
  point: number;
};

type Params = {
  date: string;
  matchType: string;
  result: ResultByPlayer[];
  uuid: string;
};
const COLUMN_LENGTH = 13;
function isUnique(string: string) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sh.getLastRow();
  const range = sh.getRange(1, 1, lastRow, 1);
  for (const row of range.getValues()) {
    if (string === row[0]) {
      return false;
    }
  }
  return true;
}

function getCol(string: string) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastColumn = ss.getLastColumn();
  var range = ss.getRange(1, 1, 1, lastColumn);
  var values = range.getValues()[0];
  for (let i = 0; i < lastColumn; i++) {
    if (values[i] == string) {
      return i + 1;
    }
  }
  return false;
}

function makeUrl(uuid: string) {
  return `https://game.mahjongsoul.com/?paipu=${uuid}`;
}

function makeRowArray(params: Params) {
  const names = params.result.map(e => e.name);
  const { date, matchType, uuid, result } = params;

  let row: { [column: number]: string | number } = {};
  names.forEach(name => {
    const col = getCol(name) as number;
    const point = result.find(e => e.name === name)!.point!;
    row[col] = point;
  });
  row[1] = date;
  row[2] = matchType;
  row[3] = makeUrl(uuid);
  for (let i = 0; i < 4; i++) {
    row[10 + i] = `=XLOOKUP(LARGE($D2:$H2,${i + 1}),$D2:$I2,$D$1:$I$1)`;
  }
  const rowArray = Object.entries(row).reduce((prev, [key, value]) => {
    prev[parseInt(key) - 1] = value;
    return prev;
  }, new Array(COLUMN_LENGTH).fill(''));
  return rowArray;
}

function validateData(
  params: Params
): { status: 'ok' } | { status: 'error'; message: string } {
  const { date } = params;
  const names = params.result.map(e => e.name);
  if (!isUnique(date)) {
    return { status: 'error', message: 'Err no unique data' };
  }
  if (!names.map(name => getCol(name)).every(n => n !== false)) {
    return { status: 'error', message: 'Err exists non registered name' };
  }
  if (names.length !== 4) {
    return { status: 'error', message: 'Err not compatible not yonma' };
  }
  return { status: 'ok' };
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  //@ts-ignore
  const params = JSON.parse(e.postData.getDataAsString()) as Params;
  const validationResult = validateData(params);
  if (validationResult.status === 'error') {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', result: validationResult.message })
    );
  }
  const rowArray = makeRowArray(params);

  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, COLUMN_LENGTH).setValues([rowArray]);

  const output = ContentService.createTextOutput(
    JSON.stringify({ result: 'Ok' })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
