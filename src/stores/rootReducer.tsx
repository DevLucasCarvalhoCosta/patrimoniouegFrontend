import { combineReducers } from '@reduxjs/toolkit';

import globalReducer from './global.store';
import importacaoReducer from './importacao.store';
import tagsViewReducer from './tags-view.store';
import userReducer from './user.store';

const rootReducer = combineReducers({
  user: userReducer,
  tagsView: tagsViewReducer,
  global: globalReducer,
  importacao: importacaoReducer,
});

export default rootReducer;
