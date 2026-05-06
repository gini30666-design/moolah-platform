import { google } from 'googleapis'

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDS7RYIen/GVtPQ
NX6HkefoM/uwJVOcx0uXyxZQOSAYEOQCaxYl4N4NHmHAnBbDGYQllEUT4y16kGXa
NuUdZGlkQ2XlcSxm3e3mZd9EQ1qMcXt1xRPKpkOWw6snHwsIBBFcflgQhCV/lQJq
QHOeHBT7MBkgaIxrq+CQtkiGjQ+HI0vrTt4B5+O8Iv8u1myFzZzGMINUWPu2fq2P
CoxnJIDm6vWD0z3mWXzog1qjoOQu+A8ILQlqfdf1vRcHB9pBdJx7rioyaCdXQXZb
1WEl+VhQgnGzOWQ+I/rJ6blgIWC+lsc7w++G+MeTvs4a6jewYj55ZXlEaqY6+BGY
nvb4JuVtAgMBAAECggEABiKXxrjbcRcy84Yuzz4u9unWKw4246NHX1usozo6JQEO
xMQ9IW5sPwjwcnQH1HZwSdCJftXXi45aLBH3MZbrWtt8AgO79SUE57P0Xc2wu0+M
tgT8uaMC6cZ4urtULJBDugNBx/80AQVCS/lic4mhEZpZTMBFv1cBQexPaTx+pGFU
rV2EDLelsio3luU7+y5vyxdY4yF1c5/3Ug2k3VMohNuK4xr6yzIKDgf2Q0ktdsXq
4SPQKCDAaFWfwywbwbfoNqOUi27TTB7awY2xHoyvhUUa7kFARiO10BuhFRslNtux
24gf6QN9EDf/6AzVoAXiAtV+nIy/lXZh0aDi2bcieQKBgQDtOz/OsVz4wx9sS7OW
i52l/1rlzHMA9capwnDgrURO2VQS3RglTB/8VqsFISxmWTJXGar/ul8sam0x0jdq
0bj3KgtxXSoGI1vsFdBPufir4pC7p38JxW0plGyBnn8c/PvmRrbJb1qpwONZ47Nh
I95jalb+KzQrI+7EPUoFVO9UGQKBgQDjnRBQP6Drmi4CrDup1s/HTLUvnQDcbKk/
7V9/nUSRiOXI0C3DmoyY5reglLGP8BwvHGCgLGwWIR0vmXxXsIIkn9tNfvElz0Fy
t5LCfbjiJ0m/iEu5VQb/bk3Ao3zSCptJRisA8Oux9PWxHKAATNuuG6VeYw9zPS5D
P+h4Sc/mdQKBgQCbSFch4nLq2j3tUzgAaO8OQzGqjcMRc89QO1hLmN7HhfZESriN
YWDmeYyEVQyNCgGrhb+qmMHHfvpuzB0+LH0YPEs1LzhcwDRhOn4aUa72Q91dF+xN
5w7nUqIbzjWCMg5o0wy+mccMqpemtScrhKEDDg5XXMxPGLwnc77J8qidsQKBgQCG
BKjiV1Ss5K9Kq5bFvdHBi4zzaAJlxyUwmtesEDGbb3u87bbEgW9faBme125lTf+K
Ta8nIIDT1tOUf08TYr5+ShGaY7AhjxL+NNCY6+W8Y12tBNdxXHsuUwg88QZBtjUQ
w9v2ReTBd3ZivnQHOTnwHh8UoEcsl01yE2MR0IQ1MQKBgG95ccyBHMabm3aiAP1U
6V9AH4LXCbH9ATs89xodE94oDd0yUpUM1qhx4yyUYEkW/zzoIeyqAgPQ589bnzg6
D+UbTb0cZlFBtyc5zSK8KjQGloobs4q89pvwYDJxckhgfI1uNZ/XgvjSQndZTFQd
WNCG4JA+PCnS1u4nFQwnRKTq
-----END PRIVATE KEY-----`

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'moolah-sheets@ginimcp.iam.gserviceaccount.com',
    private_key: PRIVATE_KEY,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
})

const sheetsClient = google.sheets({ version: 'v4', auth })
const driveClient = google.drive({ version: 'v3', auth })

const SHEET_TABS = [
  {
    name: 'providers',
    headers: ['id', 'name', 'category', 'description', 'lineUserId', 'avatarUrl'],
  },
  {
    name: 'services',
    headers: ['providerId', 'id', 'name', 'price', 'duration', 'description'],
  },
  {
    name: 'portfolio',
    headers: ['providerId', 'id', 'imageUrl', 'caption'],
  },
  {
    name: 'bookings',
    headers: ['id', 'providerId', 'serviceId', 'customerName', 'customerLineUserId', 'date', 'time', 'note', 'createdAt'],
  },
  {
    name: 'availability',
    headers: ['providerId', 'dayOfWeek', 'startTime', 'endTime'],
  },
]

const SPREADSHEET_ID = '1QwsKUYZpLOHg76IS9mxo-KcprasfIK9wSva__h3kMvs'

async function main() {
  // 1. 取得現有分頁資訊
  console.log('讀取現有 Spreadsheet...')
  const meta = await sheetsClient.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const existingSheets = meta.data.sheets ?? []
  const existingTitles = existingSheets.map(s => s.properties?.title ?? '')
  console.log('現有分頁：', existingTitles.join(', '))

  // 2. 新增缺少的分頁
  const missingTabs = SHEET_TABS.filter(t => !existingTitles.includes(t.name))
  if (missingTabs.length > 0) {
    console.log(`\n新增分頁：${missingTabs.map(t => t.name).join(', ')}`)
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: missingTabs.map(tab => ({
          addSheet: { properties: { title: tab.name } },
        })),
      },
    })
    console.log('✅ 分頁新增完成')
  }

  // 3. 寫入所有 Headers（冪等：覆寫第一列）
  console.log('\n寫入欄位 Headers...')
  await sheetsClient.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: SHEET_TABS.map(tab => ({
        range: `${tab.name}!A1`,
        values: [tab.headers],
      })),
    },
  })
  console.log('✅ 所有分頁 Headers 寫入完成')

  // 4. 刪除預設的 Sheet1（若存在）
  const sheet1 = existingSheets.find(s => s.properties?.title === 'Sheet1' || s.properties?.title === '工作表1')
  if (sheet1) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ deleteSheet: { sheetId: sheet1.properties?.sheetId } }],
      },
    })
    console.log('✅ 預設工作表已刪除')
  }

  console.log('\n=== 設定完成 ===')
  console.log(`GOOGLE_SHEETS_ID=${SPREADSHEET_ID}`)
}

main().catch(err => {
  console.error('錯誤：', err.message)
  process.exit(1)
})
