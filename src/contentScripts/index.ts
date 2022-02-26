/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // communication example: send previous tab title from background page
  /* onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  }) */

  onMessage("start", ({ data }) => {
    sendMessage("changeIcon", { icon: "resume" }, { context: "popup" })
    start(data)
    sendMessage("changeIcon", { icon: "pause" }, { context: "popup" })
  })
})()

var data = []
function start(scrapData) {
  console.log("storageData", scrapData)
  // Get table headers
  const columns = document.querySelectorAll(
    ".result-container .ant-table-header table thead th:not(.ant-table-selection-column):not(.actions)",
  )
  if (columns?.length) {
    data = [
      [...columns]
        .filter(e => e.textContent !== "")
        .map((e) => {
          return `"${e.textContent.replace(/"/g, '"')}"`
        }),
    ]

    // Get table body content
    let rows = document.querySelectorAll(
      ".result-container .ant-table-body table tbody .ant-table-row",
    )
    rows = [...rows].filter(e => e.textContent !== "")

    if (rows?.length) {
      for (const node of rows) {
        const singleRow = node.querySelectorAll(
          "td:not(.ant-table-selection-column):not(.actions)",
        )
        let row = [...singleRow].map((e) => {
          return e.textContent.replace(/[\n?\r?\s?]+/g, " ")
        })
        row = row.map((e) => {
          return `"${e.replace(/"/g, '"')}"`
        })
        data.push(row)
      }
      console.log("newData:", data)

      if (data) {
        const finalData = {
          page: `${
            document.querySelector(".pagination-current-page").textContent
          }`,
          data,
        }
        chrome.storage.local.set({ scrapData: finalData })
      }
    }
  }
}
