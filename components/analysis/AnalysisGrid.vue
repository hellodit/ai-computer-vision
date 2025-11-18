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
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <UCard
      v-for="(label, index) in props.items"
      :key="`${label}-${index}`"
      :class="[
        'cursor-pointer rounded-2xl border transition w-full',
        isSelected(label)
          ? 'border-primary-500 bg-primary-50 dark:border-primary-400/70 dark:bg-primary-500/10'
          : 'border-gray-200 bg-white hover:border-primary-200 dark:border-gray-800 dark:bg-gray-900'
      ]"
      @click="handleSelectionChange(label, !isSelected(label))"
    >
      <label
        class="flex items-start gap-3 text-left"
        :aria-checked="isSelected(label)"
        role="checkbox"
      >
        <UCheckbox
          :model-value="isSelected(label)"
          @update:model-value="handleSelectionChange(label, $event)"
          class="mt-0.5"
          aria-label="Pilih analisis"
          @click.stop
        />
        <div>
          <p class="text-base font-semibold capitalize text-gray-900 dark:text-white">
            {{ label }}
          </p>
        </div>
      </label>
    </UCard>
  </div>
</template>
