<template>
  <div class="min-w-max m-5 space-y-5">
    <div class="mt-1 flex rounded-md shadow-sm">
      <div class="relative flex items-stretch flex-grow focus-within:z-10">
        <input
          id="page_no"
          type="text"
          name="page_no"
          class="
            focus:ring-indigo-500 focus:border-indigo-500
            block
            w-full
            rounded-none rounded-l-md
            sm:text-sm
            border-gray-300
          "
          placeholder="Enter Page No."
        />
      </div>
      <button
        type="button"
        class="
          -ml-px
          relative
          inline-flex
          items-center
          space-x-2
          px-4
          py-2
          border border-gray-300
          text-sm
          font-medium
          rounded-r-md
          text-gray-700
          bg-gray-50
          hover:bg-gray-100
          focus:outline-none
          focus:ring-1
          focus:ring-indigo-500
          focus:border-indigo-500
        "
      >
        <!-- Heroicon name: solid/refresh -->
        <RefreshIcon class="h-5 w-5 text-gray-400" />
        <span>Reset</span>
      </button>
    </div>

    <div class="flex justify-between gap-5">
      <button
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
        "
        :class="[
          !isFetching
            ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            : 'bg-indigo-400 hover:bg-indigo-500 focus:ring-indigo-300',
        ]"
        @click="send('start')"
      >
        <PlayIcon v-if="!isFetching" id="resume_icon" class="h-5 w-5 mr-2" />
        <PauseIcon v-else id="pause_icon" class="h-5 w-5 mr-2" />
        Scrap
      </button>

      <button
        id="download_btn"
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
        "
        :class="[
          !isDownloading
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'bg-green-400 hover:bg-green-500 focus:ring-green-300',
        ]"
        @click="downloadCSV"
      >
        <DownloadIcon v-if="!isDownloading" class="h-5 w-5 mr-2" />

        <svg
          v-else
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ !isDownloading ? "Download" : "Processing..." }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { RefreshIcon, PlayIcon, PauseIcon } from "@heroicons/vue/solid"
import { DownloadIcon } from "@heroicons/vue/outline"
import { sendMessage, onMessage } from "webext-bridge"

const isFetching = ref(false)
const isDownloading = ref(false)

function send(action) {
  console.log("action", action)
  chrome.tabs.query({ currentWindow: true, active: true }, async(tabs) => {
    const activeTab = tabs[0].id
    // sendMessage(action, {}, `content-script@${activeTab}`)

    const scrapData = await getLocalStorageValue("scrapData")
    sendMessage(
      action,
      { scrapData },
      { context: "content-script", tabId: activeTab },
    )
  })
}

onMessage("changeIcon", ({ data }) => {
  isFetching.value = data.icon === "resume"
})

async function getLocalStorageValue(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        resolve(result)
      })
    }
    catch (ex) {
      console.error(ex)
      reject(ex)
    }
  })
}

async function downloadCSV() {
  isDownloading.value = true
  const scrapData = await getLocalStorageValue("scrapData")
  setTimeout(() => {
    let csvContent = scrapData.scrapData.data
      .map(e => e.join(","))
      .join("\n")
    csvContent = `data:text/csv;charset=utf-8,${csvContent}`
    const encodedUri = encodeURI(csvContent)
    const downloadLink = document.createElement("a")
    downloadLink.download = `page${scrapData.scrapData.page}.csv`
    downloadLink.href = encodedUri
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    isDownloading.value = false
  }, 500)
}
</script>
