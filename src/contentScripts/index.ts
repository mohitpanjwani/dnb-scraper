/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  onMessage("getPageInfo", () => {
    getPageInfo()
  })

  onMessage("startScraping", ({ data }) => {
    start(data)
  })

  onMessage("nextPage", () => {
    gotoNextPage()
  })

  onMessage("stop", () => {
    stop()
  })
})()

var interval = null

// send message to defined context "content-script" | "popup" | "devtools" | "background"
function send(action, context, data = {}) {
  sendMessage(action, data, { context })
}

// get current and last page
function getPageInfo() {
  const stateCheck = setInterval(() => {
    if (document.readyState === "complete") {
      clearInterval(stateCheck)
      const pageInfo = document.querySelector(".pagination-page-info")

      if (pageInfo) {
        const page = pageInfo.textContent.replace(/\s(of)\s/g, ",").split(",")
        send("setInitialState", "background", {
          currentPageNumber: parseInt(page[0]),
          lastPageNumber: parseInt(page[1]),
        })
      }
    }
  }, 100)
}

// start scraping
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

// check "result-container" is loaded or not
function checkIfLoaded(data) {
  interval = setInterval(() => {
    if (document.getElementsByClassName("result-container").length >= 1) {
      clearInterval(interval)
      scrapePage(data)
    }
  }, 1000)
}

function startScraping(data) {
  const pageLoaded
    = document.getElementsByClassName("result-container").length >= 1

  if (pageLoaded) scrapePage(data)
  else checkIfLoaded(data)
}

// scrape data
function scrapePage({ currentPageNumber, lastPageNumber, totalPagesScraped }) {
  const columns = []
  const data = []

  // Get table headers
  if (totalPagesScraped === 0) {
    let fields = document.querySelectorAll(
      ".result-container .ant-table-header table thead th:not(.ant-table-selection-column):not(.actions)",
    )
    fields = [...fields]
      .filter(e => e.textContent !== "")
      .map((e) => {
        return `"${e.textContent.replace(/^\"(.+)\"$/, '"')}"`
      })
    columns.push(fields)
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
        "setData",
        { page: currentPageNumber, lastPage: lastPageNumber, data, columns },
        { context: "background" },
      )
      if (currentPageNumber >= lastPageNumber) {
        stop()
        return false
      }
    }
  }
}

// goto next page
function gotoNextPage() {
  document.getElementById("next")?.click()
}

// stop scraping
function stop() {
  if (interval) clearInterval(interval)

  sendMessage("stop", {}, { context: "background" })
}

// change event for goto page number
const gotoNumber = document.querySelector(".ant-input-number-input")
gotoNumber?.addEventListener("change", (e) => {
  sendMessage(
    "changeGotoPageNumber",
    { gotoPageNumber: e.target.value },
    { context: "background" },
  )
})
