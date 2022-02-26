/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge"

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // communication example: send previous tab title from background page
  /* onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  }) */

  onMessage("start", ({ data }) => {
    start(data)
  })

  onMessage("stop", () => {
    stop()
  })
})()

let data = []
const interval = null

function start(data) {
  if (document.readyState === 'ready' || document.readyState === 'complete') {
    startScraping(data)
  }
  else {
    document.onreadystatechange = function() {
      if (document.readyState === "complete")
        startScraping(data)
    }
  }
}

function stop() {
  if (interval)
    clearInterval(interval)
}

function checkIfLoaded(data) {
  const interval = setInterval(() => {
    if (document.getElementsByClassName('result-container').length >= 1) {
      clearInterval(interval)
      scrapPage(data)
    }
  }, 1000)
}

function startScraping(data) {
  const pageLoaded = document.getElementsByClassName('result-container').length >= 1

  if (pageLoaded)
    scrapPage(data)

  else
    checkIfLoaded(data)
}

function scrapPage({ pageNumber }) {
  console.log('starting', pageNumber)

  // Get table headers
  const columns = document.querySelectorAll(
    ".result-container .ant-table-header table thead th:not(.ant-table-selection-column):not(.actions)",
  )

  const currentPage = document.querySelector(".pagination-current-page")?.textContent || 1

  // Exit if the current page is already scraped.
  if (parseInt(currentPage) < parseInt(pageNumber)) {
    sendMessage("onStop", { }, { context: "popup" })
    return
  }

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

      sendMessage("changePage", { page: currentPage, data }, { context: "popup" })

      document.getElementById('next')?.click()
    }
  }
}
