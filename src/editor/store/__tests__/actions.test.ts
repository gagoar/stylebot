import * as postcss from 'postcss';
import actions from '../actions';

import mockState from '../__mocks__/state';
import CssUtils from '../../../css/CssUtils';
import * as chromeUtils from '../../utils/chrome';

jest.mock('postcss');
jest.mock('../../utils/chrome');
jest.mock('../../../css/CssUtils');

const mockRoot = {
  some: jest.fn(),
  walkRules: jest.fn(),
  append: jest.fn(),
  toString: jest.fn(),
};

const mockCommit = jest.fn();
const mockDispatch = jest.fn();

describe('actions', () => {
  beforeAll(() => {
    CssUtils.injectRootIntoDocument = jest.fn();
    Object.defineProperty(chromeUtils, 'setStyle', { value: jest.fn() });
  });

  beforeEach(() => {
    jest.resetAllMocks();

    Object.defineProperty(postcss, 'parse', {
      value: jest.fn().mockImplementation(() => {
        return mockRoot;
      }),
    });
  });

  describe('applyCss', () => {
    it('does not commit invalid css', () => {
      Object.defineProperty(postcss, 'parse', {
        value: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
      });

      try {
        actions.applyCss(
          { commit: mockCommit, state: mockState },
          { css: 'invalid' }
        );
      } catch (e) {
        expect(mockCommit).toBeCalledTimes(0);
        expect(chromeUtils.setStyle).toBeCalledTimes(0);
        expect(CssUtils.injectRootIntoDocument).toBeCalledTimes(0);
      }
    });

    it('invokes setSave correctly', () => {
      const css = 'a { color: red; }';

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setSelectors', mockRoot);

      expect(chromeUtils.setStyle).toBeCalledWith(mockState.url, css);
      expect(CssUtils.injectRootIntoDocument).toBeCalledWith(
        mockRoot,
        mockState.url
      );
    });
  });

  describe('applyDeclaration', () => {
    it('no-op if no selector is active', () => {
      actions.applyDeclaration(
        { state: mockState, dispatch: mockDispatch },
        {
          property: 'color',
          value: 'red',
        }
      );

      expect(CssUtils.addDeclaration).toBeCalledTimes(0);
      expect(mockDispatch).toBeCalledTimes(0);
    });

    it('invokes addDeclaration correctly', () => {
      const state = { ...mockState, activeSelector: 'a' };

      Object.defineProperty(CssUtils, 'addDeclaration', {
        value: jest.fn(() => 'outputOfAddDeclaration'),
      });

      actions.applyDeclaration(
        {
          state,
          dispatch: mockDispatch,
        },
        {
          property: 'color',
          value: 'red',
        }
      );

      expect(CssUtils.addDeclaration).toBeCalledWith('color', 'red', 'a', '');
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'outputOfAddDeclaration',
      });
    });
  });
});