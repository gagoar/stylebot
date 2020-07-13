import * as postcss from 'postcss';

import { State, CssSelectorMetadata } from './';
import { StylebotPlacement, StylebotOptions } from '../../types';

export default {
  setVisible(state: State, visible: boolean): void {
    state.visible = visible;
  },

  setPosition(state: State, position: StylebotPlacement): void {
    state.position = position;
  },

  setOptions(state: State, options: StylebotOptions): void {
    state.options = options;
  },

  setUrl(state: State, url: string): void {
    state.url = url;
  },

  setEnabled(state: State, enabled: boolean): void {
    state.enabled = enabled;
  },

  setCss(state: State, css: string): void {
    state.css = css;
  },

  setActiveSelector(state: State, selector: string): void {
    state.activeSelector = selector;
  },

  setInspecting(state: State, inspecting: boolean): void {
    state.inspecting = inspecting;
  },

  setSelectors(state: State, root: postcss.Root): void {
    const selectors: Array<CssSelectorMetadata> = [];

    root.walkRules(rule => {
      try {
        selectors.push({
          value: rule.selector,
          count: document.querySelectorAll(rule.selector).length,
        });
      } catch (e) {}
    });

    // sort in descending order of number of affected elements
    selectors.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      } else if (b.value > a.value) {
        return -1;
      } else {
        return 1;
      }
    });

    state.selectors = selectors;
  },

  setHelp(state: State, help: boolean): void {
    state.help = help;
  },
};