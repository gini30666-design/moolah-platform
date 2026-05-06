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

const SPREADSHEET_ID = '1QwsKUYZpLOHg76IS9mxo-KcprasfIK9wSva__h3kMvs'

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: 'moolah-sheets@ginimcp.iam.gserviceaccount.com', private_key: PRIVATE_KEY },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

async function main() {
  // providers: 擴充欄位
  // id / name / category / description / lineUserId / avatarUrl
  // / storeName / address / district / businessHours / phone / instagram
  const providersHeader = [
    'id', 'name', 'category', 'description', 'lineUserId', 'avatarUrl',
    'storeName', 'address', 'district', 'businessHours', 'phone', 'instagram',
  ]

  // bookings: 擴充欄位
  // id / providerId / serviceId / customerName / customerLineUserId / date / time / note / createdAt
  // / gender / hairLength
  const bookingsHeader = [
    'id', 'providerId', 'serviceId', 'customerName', 'customerLineUserId',
    'date', 'time', 'note', 'createdAt', 'gender', 'hairLength',
  ]

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'providers!A1', values: [providersHeader] },
        { range: 'bookings!A1', values: [bookingsHeader] },
      ],
    },
  })

  // 更新測試資料設計師 Chloe（補齊欄位）
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'providers!A2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'designer-001', 'Chloe 設計師', '髮型設計師',
        '擅長韓系質感剪髮、霧感染髮，讓你每天出門都自信滿滿',
        'U_PLACEHOLDER_LINE_ID', '',
        'Chloe Hair Studio', '高雄市苓雅區某路123號', '苓雅區',
        '週二至週日 10:00–19:00，週一公休',
        '0912-345-678', '',
      ]],
    },
  })

  console.log('✅ Sheets schema 更新完成')
  console.log('providers 欄位：', providersHeader.join(' / '))
  console.log('bookings 欄位：', bookingsHeader.join(' / '))
}

main().catch(err => { console.error(err.message); process.exit(1) })
