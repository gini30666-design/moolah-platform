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
  credentials: {
    client_email: 'moolah-sheets@ginimcp.iam.gserviceaccount.com',
    private_key: PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheetsClient = google.sheets({ version: 'v4', auth })

async function main() {
  // providers: id / name / category / description / lineUserId / avatarUrl
  const providers = [
    ['designer-001', 'Chloe 設計師', '髮型設計師', '擅長韓系質感剪髮、霧感染髮，讓你每天出門都自信滿滿', 'U_PLACEHOLDER_LINE_ID', ''],
  ]

  // services: providerId / id / name / price / duration / description
  const services = [
    ['designer-001', 'svc-001', '韓系質感剪髮', '800', '60', '含洗髮、剪髮、吹整'],
    ['designer-001', 'svc-002', '霧感染髮（全頭）', '2500', '120', '日系霧感，低傷害配方'],
    ['designer-001', 'svc-003', '燙髮（基礎）', '2000', '150', '含前處理護理'],
    ['designer-001', 'svc-004', '頭皮深層護理', '600', '45', '舒緩頭皮、強健髮根'],
  ]

  // 模擬兩筆已有預約（用於測試時段庫存）
  const today = new Date().toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-')

  const bookings = [
    ['BK_TEST_001', 'designer-001', 'svc-001', '測試客戶A', 'U_TEST_001', today, '10:00', '', new Date().toISOString()],
    ['BK_TEST_002', 'designer-001', 'svc-002', '測試客戶B', 'U_TEST_002', today, '14:00', '想要偏灰的色調', new Date().toISOString()],
  ]

  console.log('寫入測試資料...')
  await sheetsClient.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'providers!A2', values: providers },
        { range: 'services!A2', values: services },
        { range: 'bookings!A2', values: bookings },
      ],
    },
  })

  console.log('✅ 測試資料寫入完成')
  console.log(`\n設計師頁面網址：https://moolah-platform.vercel.app/designer-001`)
  console.log(`預約頁面：https://moolah-platform.vercel.app/designer-001/book?service=svc-001`)
  console.log(`\n今日日期 ${today} 已有預約：10:00（60分）、14:00（120分）`)
  console.log('→ 10:30 和 13:30 應顯示「熱門推薦」')
}

main().catch(err => {
  console.error('錯誤：', err.message)
  process.exit(1)
})
