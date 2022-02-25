/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // communication example: send previous tab title from background page
  /* onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  }) */

  onMessage("start", () => {
    console.log("click on scrap")
    sendMessage("changeIcon", { icon: "resume" }, { context: "popup" })
    start()
    sendMessage("changeIcon", { icon: "pause" }, { context: "popup" })
  })

  onMessage("download", () => {
    downloadCSV()
  })
})()

var data = []
function start() {
  console.log("start")
  const tHead = document.querySelectorAll(
    ".result-container .ant-table-header table thead th",
  )
  data = [
    [...tHead].filter(e => e.textContent !== "").map(e => e.textContent),
  ]
  let tBody = document.querySelectorAll(
    ".result-container .ant-table-body table tbody .ant-table-row",
  )
  tBody = [...tBody].filter(e => e.textContent !== "")

  if (tBody) {
    for (const node of tBody) {
      const singleCard = node.querySelectorAll("td:not(.ant-table-selection-column):not(.actions)")
      let cardDetails = [...singleCard]
        .map((e) => {
          return e.textContent.replace(/[\n?\r?\s?]+/g, " ")
        })
      cardDetails = cardDetails.map((e) => {
        return `"${e.replace(/"/g, '"')}"`
      })
      data.push(cardDetails)
    }
    console.log(data)
  }
}

function downloadCSV() {
  console.log(data)
  let csvContent = data.map(e => e.join(",")).join("\n")
  csvContent = `data:text/csv;charset=utf-8,${csvContent}`
  const encodedUri = encodeURI(csvContent)
  const downloadLink = document.createElement("a")

  downloadLink.download = `page${
    document.querySelector(".pagination-current-page").textContent
  }.csv`
  downloadLink.href = encodedUri
  downloadLink.style.display = "none"
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}
