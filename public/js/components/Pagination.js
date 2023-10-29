import { nextTick, ref, watch } from '../lib/vue.esm-browser.js';
import { clamp } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {number} modelValue
 * @property {number} total
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    modelValue: Number,
    total: Number
  },
  emits: ['update:model-value'],

  /**
   * @param {Props} props
   */
  setup(props, { emit }) {
    /* -- DATA -- */

    /** @type {Vue.Ref<number>} */
    const value = ref(0);

    /* -- WATCHERS -- */

    watch(
      () => props.modelValue,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          value.value = newVal;
        }
      },
      { immediate: true }
    );

    /* -- METHODS -- */

    const emitInput = () => {
      if (value.value !== props.modelValue) {
        emit('update:model-value', value.value);
        nextTick(() => scrollWithDelay());
      }
    };

    const pageNext = () => {
      value.value = clamp(value.value + 1, 1, props.total);
      emitInput();
    };

    const pagePrevious = () => {
      value.value = clamp(value.value - 1, 1, props.total);
      emitInput();
    };

    const scrollWithDelay = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    return {
      value,
      emitInput,
      pageNext,
      pagePrevious
    };
  },

  template: /* HTML */ `
    <form @submit.prevent class="pagination pure-form mt-lg mb-lg">
      <button @click="pagePrevious" class="pure-button mr-md" type="button">
        Previous
      </button>

      <span>
        <input
          :max="total"
          @keydown.enter="emitInput"
          class="pure-input pagination-input"
          min="1"
          type="number"
          v-model.number="value"
        />
        of {{ total }}
      </span>

      <button @click="pageNext" class="pure-button ml-md" type="button">
        Next
      </button>
    </form>
  `
};
