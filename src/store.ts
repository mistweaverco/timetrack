import { createStore } from 'redux'
import { dataReducer } from './store/reducer'

export const store = createStore(dataReducer)

