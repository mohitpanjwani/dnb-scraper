/* eslint-disable no-console */
import { onMessage, sendMessage } from "webext-bridge";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  onMessage("getPageInfo", ({ data }) => {
    getPageInfo(data)
  })

  onMessage("startScraping", ({ data }) => {
    start(data)
  })

  onMessage("nextPage", ({ data }) => {
    gotoNextPage(data)
  })

  onMessage("stop", () => {
    stop()
  })
})()

// send message to defined context "content-script" | "popup" | "devtools" | "background"
function send(action, context, data = {}) {
  sendMessage(action, data, { context })
}

// get current and last page
function getPageInfo(tabId) {
  var stateCheck = setInterval(() => {
    const pageInfo = document.querySelector(".pagination-page-info")
    if (document.readyState === "complete" && pageInfo) {
      clearInterval(stateCheck)

      const page = pageInfo.textContent.replace(/\s(of)\s/g, ",").split(",")
      send("setInitialState", "background", {
        currentPageNumber: parseInt(page[0]),
        lastPageNumber: parseInt(page[1]),
        tabId,
      })
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
  var interval = setInterval(() => {
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
function gotoNextPage(data) {
  if (document.getElementById("next")) {
    document.getElementById("next").click()
    getPageInfo(data)
    var interval = setInterval(() => {
      if (document.getElementsByClassName("result-container").length >= 1) {
        clearInterval(interval)
        sendMessage("startNextPageScraping", {}, { context: "background" })
        bindGotoPageEvent()
      }
    }, 1000)
  }
}

// stop scraping
function stop() {
  sendMessage("stop", {}, { context: "background" })
}

// change event for goto page number
function bindGotoPageEvent() {
  var interval = setInterval(() => {
    const gotoNumber = document.querySelector(".ant-input-number-input")
    if (gotoNumber) {
      clearInterval(interval)
      gotoNumber.removeEventListener("change", changePage)
      gotoNumber.addEventListener("change", changePage)
    }
  }, 1000)

  function changePage(e) {
    console.log("asdfdsfewrewrewwwwww", new Date().getTime())
    sendMessage(
      "changeGotoPageNumber",
      { gotoPageNumber: e.target.value },
      { context: "background" },
    )
    sendMessage(
      "updateCurrentPageNumber",
      { currentPageNumber: e.target.value },
      { context: "popup" },
    )
    bindGotoPageEvent()
  }
}
bindGotoPageEvent()
