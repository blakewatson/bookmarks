import { ref } from '../lib/vue.esm-browser.js';
import { fetcher } from '../utils.js';

/** @type {Vue.ComponentOptions} */
export default {
  emits: ['token-added'],
  setup(props, { emit }) {
    /** @type {Vue.Ref<string>} */
    const message = ref('');
    /** @type {Vue.Ref<string>} */
    const token = ref('');

    const addToken = () => {
      message.value = '';

      fetcher('/ping', {}, token.value)
        .then((res) => {
          if (res.status === 401) {
            message.value = 'Nope';
          } else if (res.status !== 200) {
            message.value = 'Server error';
          } else {
            message.value = '';
            window.localStorage.setItem('bw-token', token.value);
            emit('token-added');
          }
        })
        .catch((err) => {
          console.error(err);
        });
    };

    return {
      message,
      token,
      addToken
    };
  },

  template: /* HTML */ `
    <form class="pure-form pure-form-stacked" @submit.prevent="addToken">
      <p>
        <label>
          Token
          <input class="pure-input-2-3" type="text" v-model="token" />
        </label>
      </p>
      <button class="pure-button pure-button-primary" type="submit">Go</button>
      <p class="error" v-if="message">{{ message }}</p>
    </form>
  `
};
