## じゃんたま友人戦成績管理スクリプト

### 使い方

0. スプシにバイドされた GAS に`src/func.ts` をデプロイしておく

1. スプシの１行目に[`日付`, `対戦種別`, `牌譜`, `<対局者 1 の名前>`,`<対局者 2 の名前>`, `<対局者 3 の名前>`, `<対局者 4 の名前>`,`<対局者 5 の名前>`,`<対局者 6 の名前>`,`1 位`,`2 位`,`3 位`,`4 位`]のカラムをこの順番で用意（今のところ 6 人まで対応。ここに登場する対局者のみを含む情報のみ収集する）
1. じゃんたま起動 & ログインしてロビー画面を開く +（Chrome 前提）Windows の場合 Ctrl + Shift + I、Mac の場合 Cmd + Option I を押して DevTool を開く
1. Console タブの下部コンソールに下記スクリプトを貼り付けて Enter
1. end が出るまで待つ
1. 完了

```js
function sleep(msec) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, msec);
  });
}
const POST_URL =
  <GAS_POST_END_POINT>;

const sendRecordList = async recordList => {
  let count = 0;
  for (const record of recordList) {
    count++;
    if (record.accounts.length !== 4) {
      continue;
    }
    const date = new Date(record.end_time * 1000).toLocaleString('ja');
    const matchType = '友人戦南喰赤' + ': ' + record.config.meta.room_id;
    const result = record.accounts.map(account => ({
      name: account.nickname,
      point:
        record.result.players.find(player => player.seat === account.seat)
          .total_point / 1000,
    }));
    const uuid = record.uuid;
    const data = { date, matchType, result, uuid };
    await fetch(POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: JSON.stringify(data),
    }).then(() => console.log(`${count} / ${recordList.length}`));
    await sleep(100);
  }
};
const outputFriendMatchList = async () => {
  let startIndex = 0;
  let getRecordNum = 0;
  const COUNT = 20;
  const FRIEND_MATCH_TYPE = 1;
  const recordList = [];
  do {
    app.NetAgent.sendReq2Lobby(
      'Lobby',
      'fetchGameRecordList',
      { start: startIndex, count: COUNT, type: FRIEND_MATCH_TYPE },
      async function (_error, Records) {
        getRecordNum = Records.record_list.length;
        for (const record of Records.record_list) {
          recordList.push(record);
        }
        startIndex += COUNT;
      }
    );
    await sleep(1000);
  } while (getRecordNum === COUNT);
  await sendRecordList(recordList);
  console.log('end');
};
outputFriendMatchList();
"
```
