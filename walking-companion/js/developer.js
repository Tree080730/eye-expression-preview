// Future integration point. Register a handler once a developer experience exists.
let handler=null;
export const developerMode={
  register(next){if(typeof next!=='function')throw new TypeError('Expected a developer-mode handler');handler=next;return ()=>{if(handler===next)handler=null;};},
  async open(context){if(!handler)return false;await handler(context);return true;}
};
