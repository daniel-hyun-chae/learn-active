import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { getRouter } from './router'

const handler = createStartHandler({
  createRouter: () => getRouter() as any,
})(defaultRenderHandler)

export default handler
