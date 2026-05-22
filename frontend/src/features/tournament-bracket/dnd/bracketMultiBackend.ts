import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { MouseTransition, TouchTransition, type MultiBackendOptions } from 'react-dnd-multi-backend'

/** Десктоп — HTML5 DnD; после touchstart — TouchBackend (удобнее на планшетах и узких экранах). */
export const bracketDndMultiBackendOptions: MultiBackendOptions = {
  backends: [
    { id: 'html5', backend: HTML5Backend, transition: MouseTransition },
    {
      id: 'touch',
      backend: TouchBackend,
      options: { enableMouseEvents: true, delayTouchStart: 140 },
      preview: true,
      transition: TouchTransition,
    },
  ],
}
