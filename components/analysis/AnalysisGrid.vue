<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  items: string[]
  modelValue?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const selectedItems = ref<string[]>([...props.modelValue])

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      selectedItems.value = []
      return
    }

    const current = selectedItems.value.join('|')
    const next = newValue.join('|')

    if (current !== next) {
      selectedItems.value = [...newValue]
    }
  }
)

const handleSelectionChange = (label: string, checked: boolean): void => {
  selectedItems.value = checked
    ? Array.from(new Set([...selectedItems.value, label]))
    : selectedItems.value.filter((item) => item !== label)

  emit('update:modelValue', selectedItems.value)
}

const isSelected = (label: string): boolean => selectedItems.value.includes(label)
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
    <button
      v-for="(label, index) in props.items"
      :key="`${label}-${index}`"
      type="button"
      :class="[
        'cursor-pointer rounded-lg border px-3 py-2 transition-all text-left flex items-center gap-2 min-w-0',
        isSelected(label)
          ? 'border-primary-500 bg-primary-50 dark:border-primary-400/70 dark:bg-primary-500/10 shadow-sm'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-primary-500/5'
      ]"
      @click="handleSelectionChange(label, !isSelected(label))"
      :aria-checked="isSelected(label)"
      role="checkbox"
    >
      <UCheckbox
        :model-value="isSelected(label)"
        @update:model-value="handleSelectionChange(label, $event)"
        size="sm"
        aria-label="Pilih analisis"
        @click.stop
      />
      <span
        :class="[
          'text-xs font-medium capitalize truncate flex-1',
          isSelected(label)
            ? 'text-primary-900 dark:text-primary-100'
            : 'text-gray-700 dark:text-gray-300'
        ]"
      >
        {{ label }}
      </span>
    </button>
  </div>
</template>
