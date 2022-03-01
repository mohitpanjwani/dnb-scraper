/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge"

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // communication example: send previous tab title from background page
  /* onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  }) */

  onMessage("init", () => {
    init()
  })

  onMessage("start", ({ data }) => {
    start(data)
  })

  onMessage("stop", () => {
    stop()
  })
})()

var interval = null

function init() {
  const stateCheck = setInterval(() => {
    if (document.readyState === "complete") {
      clearInterval(stateCheck)
      const pageInfo = document.querySelector(".pagination-page-info")

      if (pageInfo) {
        const page = pageInfo.textContent.replace(/\s(of)\s/g, ",").split(",")
        sendMessage(
          "setInitialData",
          { currentPageNumber: page[0], lastPageNumber: page[1] },
          { context: "popup" },
        )
      }
    }
  }, 100)
}
function start(data) {
  if (document.readyState === "ready" || document.readyState === "complete") {
    startScraping(data)
  }
  else {
    document.onreadystatechange = function() {
      if (document.readyState === "complete") startScraping(data)
    }
  }
}

function stop() {
  if (interval) {
    clearInterval(interval)
    sendMessage("onStop", {}, { context: "popup" })
  }
}

function checkIfLoaded(data) {
  interval = setInterval(() => {
    if (document.getElementsByClassName("result-container").length >= 1) {
      clearInterval(interval)
      scrapPage(data)
    }
  }, 1000)
}

function startScraping(data) {
  const pageLoaded
    = document.getElementsByClassName("result-container").length >= 1

  if (pageLoaded) scrapPage(data)
  else checkIfLoaded(data)
}

function scrapPage({ currentPageNumber, lastPageNumber, totalPagesScraped }) {
  let columns = []
  const data = []
  console.log("starting", currentPageNumber)

  // Get table headers
  if (totalPagesScraped === 0) {
    columns = document.querySelectorAll(
      ".result-container .ant-table-header table thead th:not(.ant-table-selection-column):not(.actions)",
    )
    columns = [...columns]
      .filter(e => e.textContent !== "")
      .map((e) => {
        return `"${e.textContent.replace(/^\"(.+)\"$/, '"')}"`
      })
    data.push(columns)
  }

  if (totalPagesScraped > 0 || columns?.length > 0) {
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
          return `"${e.replace(/^\"(.+)\"$/, '"')}"`
        })
        data.push(row)
      }

      sendMessage(
        "changePage",
        { page: currentPageNumber, lastPage: lastPageNumber, data },
        { context: "popup" },
      )
      if (parseInt(currentPageNumber) >= parseInt(lastPageNumber)) stop()
      else document.getElementById("next")?.click()
    }
  }
}
