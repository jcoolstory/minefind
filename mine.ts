var mineRatio :number = 0.1;

enum BlockStatus {
    closed, opened, checked
}

enum GameStatus{
    Running,Finish, Fail
}

//array iterate callback
interface TraceFunc{
    (source:Block,x:number,y:number): void;
}

class Point {
    x:number = 0;
    y:number = 0;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}

class Util {
    public static randomInt =  function(max:number) : number{
        return (Math.random() * max )| 0;
    }
}

class Block {
     position : Point ;
     findMines = 0;
     status : BlockStatus = BlockStatus.closed;
     isMine :boolean = false;
     
     //event
     OnStatausChange:Function;
     
     public print = function() : void{
         console.log(this.status);
     };

     public open = function(): Boolean{
         var oldStatus : BlockStatus = this.status;
         this.status = BlockStatus.opened;
         
         if (this.status != oldStatus)
            this.OnStatausChange(this);
         if (this.isMine){            
            return true;
         }
     };

     public check = function():void{
         var oldStatus : BlockStatus = this.status;
         
         this.status = BlockStatus.checked;
         if (this.status != oldStatus)
            this.OnStatausChange(this);
     };
}

class Table{
    public  table:Block[][] ;
    private size:Point;

    constructor (size:Point){
        this.size = size;        
        this.table = [];
        for(var i=0 ; i< size.x; i++){
            this.table[i] = [];
            for(var j= 0; j< size.y ; j++){
                this.table[i][j] = new Block();
            }
        }

        var points : Point[] = [];
        var mineMaxCount = (size.x * size.y * mineRatio)|0;
        var mine =0;
        
        while( mineMaxCount> mine){

            var pos:Point = new Point(Util.randomInt(size.x),Util.randomInt(size.y));
            var duplicated : Boolean = false;

            points.forEach(function(obj,int){                
               if (pos.x == obj.x && pos.y == obj.y){
                    duplicated = true;
                    return;
               }
            });

            if (!duplicated)
            {
                points[mine] = pos;
                mine++;
                this.table[pos.x][pos.y].isMine = true;   
            }
        }

        for(var i=0 ; i< size.x; i++){
            for(var j= 0; j< size.y ; j++){
                this.checkMineCount(i,j);
            }
        }
    }

    private traceElements = function(callbackFunc : TraceFunc){
        for(var y=0 ; y< this.size.y; y++){
            for(var x= 0; x< this.size.x ; x++){
                callbackFunc(this.table[x][y],x,y);                    
            }
        }        
    }

    private getConvolution= function(x:number, y:number):Array<Point> {
        var results = [];        
        var xpos = [x-1,x,x+1];
        var ypos = [y-1,y,y+1];
        for(var i :number = 0; i < xpos.length;i++){
            for(var j:number = 0 ; j <ypos.length;j++){
                
                if ( !(i == 1 && j == 1)){
                    var x = xpos[i];
                    var y = ypos[j];
                    if (this.invalidArray(x, y))
                        results.push({x:x,y:y})
                }
            }
        }

        return results;
    }

    public findBlankBlock = function(x:number, y:number){
        
        var block : Block = this.table[x][y];

        if (block.status == BlockStatus.opened ){
            return;
        }

        if (!block.isMine)
        {
            block.open();
        }

        if (block.findMines == 0)
        {
            var positions = this.getConvolution(x,y);
            positions.forEach(element => {
                this.findBlankBlock(element.x,element.y);
            });
        }
    };

    public checkFinished = function():boolean{

        var mineList: Block[] = [];
        this.traceElements(function(block:Block,x:number,y:number){
            if (block.isMine)
                mineList.push(block);
        });

        var checkedList :Block[] =[];

        this.traceElements((block:Block,x:number,y:number)=>{
            if (block.status == BlockStatus.checked ||block.status == BlockStatus.closed )
                    checkedList.push(block);
        });

        if (checkedList.length == mineList.length){
            return true;   
        }
        return false;
    }

    private checkMineCount = function(x:number, y:number) {

        if (!this.table[x][y].isMine){
            return;
        }

        var positions = this.getConvolution(x,y);
        positions.forEach(element => {
            this.table[element.x][element.y].findMines++;
        });
    }

    private invalidArray = function(x:number, y:number):boolean{
        if (x < 0 || x > this.size.x-1 || y < 0 || y  > this.size.y-1)
            return false;
        else 
            return true; 
    }

    public doFail = function(){
        this.traceElements((block:Block,x:number,y:number)=>{
            if(block.status == BlockStatus.closed)
                 block.open();
        });
    }

    public print = function() : void{
        for(var i=0 ; i < this.size.x;i++){
            for (var j=0 ; j < this.size.y;j++){
                console.log(this.table[i][j].findMines);
            }
        }
    }
}

class World{
    public map:Table;
    public status: GameStatus = GameStatus.Running;
    private elementMap:Element[][]= [];

    public init = function(element:Element) : void{
        
        var tableSize : Point = new Point(8,8);
        this.map = new Table(tableSize)

        for (var i= 0; i <tableSize.y; i++){
            this.elementMap[i] = [];
        }

        var tableEl = document.createElement("table");
        tableEl.setAttribute("class","minefinder")
        for (var j= 0 ; j < tableSize.y ; j++)
        {
            var th = document.createElement("tr");
            for (var i = 0 ; i < tableSize.x ; i++)
            {
                var td = document.createElement("td");
                this.attachElement(td,j,i);
                th.appendChild(td);
                this.elementMap[j][i] = td;
            }
            tableEl.appendChild(th);
        }
        var el = document.body.appendChild(tableEl);

        element.appendChild(tableEl)
    }

    private attachElement = function(element:Element,x:number,y:number) : void {
         var block = this.map.table[x][y];
         block.position = new Point(x,y);
         block.OnStatausChange = this.statusChange.bind(this);

         element.setAttribute("class","block");         
         element.addEventListener("click", function(evt){
             this.onClick(block,evt);
         }.bind(this));
     }

     private statusChange = function(block:Block) : void{
         
         var element:Element = this.elementMap[block.position.x][block.position.y];
         switch(block.status){
             case BlockStatus.opened:
                if (block.isMine){
                    var statusclass = "mine";

                } else if (block.findMines==0){
                    var statusclass :string= BlockStatus[block.status]             
                }
                else{
                    var statusclass :string= BlockStatus[block.status]
                    var text = document.createTextNode(block.findMines+'');
                    element.appendChild(text);
                }
                element.setAttribute("class", "block " + statusclass);
                break;
            case BlockStatus.checked:{
                var statusclass :string= BlockStatus[block.status]
                element.setAttribute("class", "block " + statusclass);
                break;
            }
        }
     }

     private onClick = function(element:Block,evt:MouseEvent){
         if (this.status != GameStatus.Running)
            return;
         switch(evt.button)
         {
             case 0:
                if (element.findMines == 0 && !element.isMine){
                    this.map.findBlankBlock(element.position.x,element.position.y);
                }
                else{
                    var result:Boolean = element.open();
                    if(result){
                        this.Failed(this)
                    } 
                }                
             break;
             case 1:
                element.check();
             break;
         }
         if (this.map.checkFinished()){
             this.Finished();
         }
     }

     public Failed = function(block:World){
        this.status == GameStatus.Fail;
        this.map.doFail();
     }

     public Finished = function(){
         this.status == GameStatus.Finish;
     }
}

function run(){
    var world :World = new World();
    world.init(document.getElementById("container")); 

}