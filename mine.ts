var mineRatio :number = 0.2;

class Size {
    x:number;
    y:number;
}

enum BlockStatus {
    Close, Open, Checked
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
    public static randomInt =  function(max:number){
        return (Math.random() * max )| 0;
    }
}

class Block {
     position : Point ;
     findMines = 0;
     status : BlockStatus = BlockStatus.Checked;
     isMine :boolean = false;
     
     OnStatausChange:Function;
     
     print = function(){
         console.log(this.status);
     };
     open = function(){
         this.status = BlockStatus.Open;
         this.OnStatausChange(this);
         if (this.isMine){            
            return true;
         }        
     };
     check = function(){
         this.status = BlockStatus.Checked;
         this.OnStatausChange(this);
     };    
     
}

class Table{
    public  table:Block[][];
    private size:Size;
    constructor (size:Size){        
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
            var x = Util.randomInt(size.x);
            var y = Util.randomInt(size.y);

            var pos1:Point = new Point(x,y);
                        
            var duple : Boolean = false;
            points.forEach(function(obj,int){                
                if (pos1.x == obj.x && pos1.y == obj.y)
                    duple = true;
            });

            if (!duple)
            {   
                points[mine] = pos1;
                mine++;
            }
        }
        
        points.forEach(element => {
            this.table[element.x][element.y].isMine = true;
        });

        for(var i=0 ; i< size.x; i++){
            for(var j= 0; j< size.y ; j++){
                this.checkMineWith(i,j);
            }
        }
    }

    private GetConvolution(x:number, y:number){
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
        
        if (this.table[x][y].status == BlockStatus.Open )
            return;

        if (this.table[x][y].isMine)
            return;

        this.table[x][y].open();

        if (this.table[x][y].findMines == 0)
        {
            
            var positions = this.GetConvolution(x,y);
            positions.forEach(element => {
                this.findBlankBlock(element.x,element.y);
            });
        }

    };

    private checkMineWith = function(x:number, y:number){
        var xpos = [x-1,x,x+1];
        var ypos = [y-1,y,y+1];
        //
        if (!this.table[x][y].isMine){
            return;
        }

        var positions = this.GetConvolution(x,y);
        positions.forEach(element => {
            this.table[element.x][element.y].findMines++;
        });
    }

    private invalidArray = function(x:number, y:number){
        if (x < 0 || x > this.size.x-1 || y < 0 || y  > this.size.y-1)
            return false;
        else 
            return true; 
    }

    print = function(){
        for(var i=0 ; i < this.size.x;i++){
            for (var j=0 ; j < this.size.y;j++){
                console.log(this.table[i][j].findMines);
            }
        }
    }
}

class World{
    public map:Table;
    private elementMap:Element[][];
    public init(element:Element){
        
        var tableSize : Size = new Size();
        tableSize.x = 8;
        tableSize.y = 8;
        this.map = new Table(tableSize)
        this.elementMap = [];
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

    attachElement = function(element:Element,x:number,y:number){
         var block = this.map.table[x][y];
         block.position = new Point(x,y);
         block.OnStatausChange = this.statusChange.bind(this);
         element.setAttribute("class","block");
         var number = document.createTextNode(this.map.table[x][y].findMines+'')
         element.appendChild(number);
         element.addEventListener("click", function(evt){
             this.onClick(block,evt);
         }.bind(this));
     }

     private statusChange(block:Block){
         
         var element:Element = this.elementMap[block.position.x][block.position.y];
         switch(block.status){
             case BlockStatus.Open:
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
            case BlockStatus.Checked:{
                var statusclass :string= BlockStatus[block.status]
                element.setAttribute("class", "block " + statusclass);
                break;
            }
        }
                

         console.log(statusclass);
     }

     private onClick(element:Block,evt:MouseEvent){
         switch(evt.button)
         {
             case 0:             
                var result:Boolean =  element.open();
                if(result){
                    this.Finish(element)
                }
                else{
                    if (element.findMines == 0){
                        this.map.findBlankBlock(element.position.x,element.position.y);
                    } 
                }
             break;
             case 1:
                element.check();
             break;
         }
     }
     public Finish(block:Block){

     }
}
var world :World;
function run(){
    world = new World();
    world.init(document.getElementById("container")); 

}