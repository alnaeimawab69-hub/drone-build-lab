/* Drone Build Lab · Lab state */


/* ================= State ================= */
export const S={mode:'learn',name:'',stage:0,explore:false,view:'parts',startT:0,endT:0,
  ded:{frame:0,mount:0,wire:0,test:0,props:0},loaded:null,mistakes:[],quizAns:{},quizDone:false,quizScore:null,
  fcRot:0,spin:{1:0,2:0,3:0,4:0},
  test:{reversed:1+Math.floor(Math.random()*4),swapped:{1:false,2:false,3:false,4:false},safety:false,confirmed:false},
  flown:{hover:0,pitch:0,roll:0,yaw:0},labels:false,explode:0,forces:true,air:true,drag:null,pending:null,dirty:false};
export const parts={}, PADS={}, WIRES=[];
