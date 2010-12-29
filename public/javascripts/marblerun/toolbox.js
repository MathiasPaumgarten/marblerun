Toolbox = Class.create(Grid, {
  
  initialize: function() {
    this.x = 0;
    this.y = 100;

    this.rows = 19;
    this.cols = 3;

    this.width = Brick.SIZE * this.cols;
    this.height = Brick.SIZE * this.rows;

    this.bricks = [new Brick(), new Brick(), new Kicker(), new Kicker(), new Brick()];

    for (var i = 0; i < this.bricks.length; i++) {
      this.bricks[i].parent = this;
      this.bricks[i].cell = {row: i * 2 + 2, col: 1};  
    }

  },

  addBrick: function(class) {
    currentBrick = new class();

    currentBrick.cell = {row: (this.bricks.length - 5) * 2 + 13, col: 1};
    currentBrick.parent = this;

    this.bricks.push(currentBrick);

  },

  onMouseUp: function(mouseX, mouseY) {
  },

  onMouseDown: function(mouseX, mouseY) {
    var brick = this.getBrickAt(this.getCell(mouseX, mouseY));
    var newBrick = new brick.class();

    console.log(brick);

    this.parent.dragBrick(newBrick);

  }

});
