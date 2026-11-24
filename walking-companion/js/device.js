const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// UI depends only on this contract. Hardware-specific details live in adapters.
export class DeviceAdapter extends EventTarget {
 async connect(){throw new Error('Adapter must implement connect');}
 async disconnect(){throw new Error('Adapter must implement disconnect');}
 async send(command,payload={}){throw new Error('Adapter must implement send');}
}
export class MockDeviceAdapter extends DeviceAdapter {
 constructor(){super();this.connected=false;this.state={name:'UNION / little wanderer',id:'UNION-DEMO-001',mode:'walking_mode',behavior:'等待相遇'};}
 emit(){this.dispatchEvent(new CustomEvent('status',{detail:{...this.state,connected:this.connected}}));}
 async connect(){await wait(650);this.connected=true;this.state.behavior='认识你，很高兴';this.emit();return {...this.state};}
 async disconnect(){await wait(160);this.connected=false;this.emit();}
 async send(command,payload={}){if(!this.connected)throw new Error('请先连接模拟伙伴');await wait(180);if(!this.connected)throw new Error('连接已断开');
  if(command==='set_scene'){this.state.mode=payload.mode;this.state.behavior=payload.state;}
  else if(command==='behavior'){this.state.behavior={come:'正在向你靠近',float:'自在地漂浮',greet:'向你摇摆打招呼'}[payload.action]||'好奇地看着你';}
  else throw new Error('Unsupported command');this.emit();return{ok:true,...this.state};}
}
// Reserved transport contracts. They deliberately do not pretend to connect.
export class WebSocketDeviceAdapter extends DeviceAdapter {
 constructor({url,encode,decode}={}){super();this.options={url,encode,decode};}
 async connect(){throw new Error('需要先配置设备地址、鉴权和指令协议');}
 async disconnect(){this.socket?.close();}
 async send(){throw new Error('尚未实现设备协议，请使用 MockDeviceAdapter');}
}
export class BluetoothDeviceAdapter extends DeviceAdapter {
 constructor({serviceUUID,characteristicUUID}={}){super();this.options={serviceUUID,characteristicUUID};}
 async connect(){if(!navigator.bluetooth)throw new Error('当前浏览器不支持 Web Bluetooth');throw new Error('需要配置设备服务、特征与指令协议');}
 async disconnect(){this.device?.gatt?.disconnect();}
 async send(){throw new Error('尚未实现设备协议，请使用 MockDeviceAdapter');}
}
export class DeviceService extends EventTarget {
 constructor(adapter=new MockDeviceAdapter()){super();this.adapter=adapter;this.connected=false;this.busy=false;this.latestScene=null;this.queue=Promise.resolve();adapter.addEventListener('status',e=>{this.connected=e.detail.connected;this.dispatchEvent(new CustomEvent('status',{detail:e.detail}));});}
 async connect(){if(this.busy)return;this.busy=true;try{await this.adapter.connect();if(this.latestScene)await this.setScene(this.latestScene);}finally{this.busy=false;}}
 async disconnect(){if(this.busy)return;this.busy=true;try{await this.adapter.disconnect();}finally{this.busy=false;}}
 async setScene(scene){this.latestScene=scene;if(!this.connected)return;const task=this.queue.catch(()=>{}).then(()=>{if(!this.connected)return;return this.adapter.send('set_scene',{mode:scene.mode,state:scene.state});});this.queue=task;return task;}
 async behavior(action){return this.adapter.send('behavior',{action});}
}
