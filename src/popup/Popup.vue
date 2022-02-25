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
          bg-green-600
          hover:bg-green-700
          focus:ring-green-500
        "
        @click="send('download')"
      >
        <DownloadIcon class="h-5 w-5 mr-2" />
        Download
      </button>
    </div>
  </div>
</template>

<script setup>
// import { storageDemo } from '~/logic/storage'
import { RefreshIcon, PlayIcon, PauseIcon } from "@heroicons/vue/solid"
import { DownloadIcon } from "@heroicons/vue/outline"
import { sendMessage, onMessage } from "webext-bridge"

const isFetching = ref(false)

function send(action) {
  console.log("action", action)
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0].id
    console.log("tabId", activeTab)
    sendMessage(action, {}, `content-script@${activeTab}`)
    // sendMessage(action, {}, { context: "content-script", tabId: activeTab })
  })
}

onMessage("changeIcon", ({ data }) => {
  isFetching.value = data.icon === "resume"
})
</script>
