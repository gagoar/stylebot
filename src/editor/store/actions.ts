import * as postcss from 'postcss';
import { Commit, Dispatch } from 'vuex';

import CssUtils from '../../css/CssUtils';

import {
  getAllOptions,
  setOption,
  setStyle,
  getStylesForPage,
  enableStyle,
} from '../utils/chrome';

import { getCss as getDarkModeCss } from '../../css/DarkMode';

import { State } from './';
import { StylebotEditingMode } from '../../types';

export default {
  async initialize({ commit }: { commit: Commit }): Promise<void> {
    const options = await getAllOptions();
    const { defaultStyle } = await getStylesForPage(false);

    if (defaultStyle) {
      const { url, enabled, css } = defaultStyle;

      commit('setUrl', url);
      commit('setCss', css);
      commit('setEnabled', enabled);

      const root = postcss.parse(defaultStyle.css);
      commit('setSelectors', root);
    }

    commit('setOptions', options);
  },

  openStylebot({ state, commit }: { state: State; commit: Commit }): void {
    commit('setVisible', true);

    if (!state.enabled) {
      enableStyle(state.url);
    }
  },

  closeStylebot({ commit }: { commit: Commit }): void {
    commit('setVisible', false);
  },

  setMode(
    { state, commit }: { state: State; commit: Commit },
    mode: StylebotEditingMode
  ): void {
    setOption('mode', mode);
    commit('setOptions', { ...state.options, mode });
  },

  applyCss(
    { commit, state }: { commit: Commit; state: State },
    { css }: { css: string }
  ): void {
    try {
      const root = postcss.parse(css);
      CssUtils.injectRootIntoDocument(root, state.url);

      commit('setCss', css);
      commit('setSelectors', root);

      setStyle(state.url, css);
    } catch (e) {
      //
    }
  },

  applyDeclaration(
    { state, dispatch }: { state: State; dispatch: Dispatch },
    { property, value }: { property: string; value: string }
  ): void {
    if (!state.activeSelector) {
      return;
    }

    const css = CssUtils.addDeclaration(
      property,
      value,
      state.activeSelector,
      state.css
    );

    dispatch('applyCss', { css });
  },

  async applyFontFamily(
    { state, dispatch }: { state: State; dispatch: Dispatch },
    value: string
  ): Promise<void> {
    let css = state.css;

    if (value) {
      css = await CssUtils.addGoogleWebFont(value, css);
    }

    if (css !== state.css) {
      dispatch('applyCss', { css });
    }

    dispatch('applyDeclaration', { property: 'font-family', value });

    css = CssUtils.cleanGoogleWebFonts(state.css);
    if (css !== state.css) {
      dispatch('applyCss', { css });
    }
  },

  applyDarkMode({
    state,
    dispatch,
  }: {
    state: State;
    dispatch: Dispatch;
  }): void {
    CssUtils.removeCSSFromDocument(state.url);
    dispatch('applyCss', { css: getDarkModeCss() });
  },
};