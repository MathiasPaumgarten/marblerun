var Breaker = new Class.create(Brick, {

  initialize: function($super) {
    $super();
    
    this.isBroken = false;
    this.isBreaking = false;
    
    this.alpha = 1.0;
    
    this.timeoutID = 0;
    this.isDynamic = true;
    this.hasShadow = false;
  },

  update: function() {
      
    if (this.isBreaking && !this.isBroken) {
      this.isBroken = true;
      var world = this.bodies[0].GetWorld();

      this.removeBody(world);
      this.createBody(world);
    }
  },

  reset: function() {
    this.isBreaking = false;
    
    this.alpha = 1.0;
    
    if (this.timeoutID) {
      
      clearTimeout(this.timeoutID);
      this.timeoutID = 0;
    
    }

    if (this.isBroken) {
      this.isBroken = false;

      var world = this.bodies[0].GetWorld();

      this.removeBody(world);
      this.createBody(world);
    }
  },
  
  createBody: function(world) {
    this.bodies = [];
    var myScope = this;

    for (var i = 0; i < this.shapes.length; i++) {
      
      var bodyDefinition = new b2BodyDef();

      bodyDefinition.position.Set(this.cell.col + 0.5, this.cell.row + 0.5);

      var body = world.CreateBody(bodyDefinition);

      this.createShapes(body, i);

      body.SetMassFromShapes();
      
      
      body.onCollision = function(contact) {
        myScope.onCollision(contact);
      };
      
      body.afterCollision = function(contact) {
        myScope.afterCollision(contact);
      };
      
      this.bodies.push(body);
      
    }
  },
  
  removeBody: function(world) {
    
    var bodyCount = world.m_bodyCount;

    for (var i = 0; i < this.bodies.length; i++) {
      world.DestroyBody(this.bodies[i]);
    }
    
    if (bodyCount == world.m_bodyCount) {
      console.error("Body was not removed");
    }
    
  },
  
  moveToCell: function(cell) {
    
    this.cell = cell;
    
    if (this.bodies.length) {
    
      for (var i = 0; i < this.bodies.length; i++) {
        
        this.bodies[i].SetXForm(new b2Vec2(cell.col + 0.5, cell.row + 0.5), this.bodies[i].GetAngle());
        
      }
      
    }
  },

  drawShape: function(context) {
    
    if (this.alpha <= 0) {
      return;
    }
      
    context.save();
  
    context.globalAlpha = this.alpha;
  
    context.translate(
      -this.cell.col * Brick.SIZE, 
      -this.cell.row * Brick.SIZE
    );

    for (var i = 0; i < this.shapes.length; i++) {
  
      context.save();
  
        var position;
        
        if (this.bodies) { 
          
          position = this.bodies[i].GetPosition();
          
        } else {
          
          position = { 
            x: this.cell.col + 0.5, 
            y: this.cell.row + 0.5
          };
          
        }
    
        context.translate(position.x * Brick.SIZE, position.y * Brick.SIZE);
        
        if (this.bodies) {
          context.rotate(this.bodies[i].GetAngle());
        }
  
        context.beginPath();

        context.moveTo(this.shapes[i][0].x * Brick.SIZE, this.shapes[i][0].y * Brick.SIZE);
      
        for (var j = 1; j < this.shapes[i].length; j++) {

            context.lineTo(this.shapes[i][j].x * Brick.SIZE, this.shapes[i][j].y * Brick.SIZE);

        }
      
        context.closePath();
        
        context.fill();
        context.stroke();
  
      context.restore();
    
      var x = this.x + (position.x - this.cell.col - 0.7) * Brick.SIZE,
          y = this.y + (position.y - this.cell.row - 0.7) * Brick.SIZE;
    
      context.addClearRectangle(new Rectangle(x, y, Brick.SIZE * 1.4, Brick.SIZE * 1.4));
  
    }
    
    context.restore();
  },
  
  drawTriangle: function(context) {
    
    context.save();

      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(-Brick.SIZE / 2, -Brick.SIZE / 2);
      context.lineTo(Brick.SIZE / 2, -Brick.SIZE / 2);
      context.closePath();
      
      context.fill();
      
    context.restore();

    context.stroke();
    
  },
  
  drawFullShape: function(context) {
    
    context.fillRect(0, 0, Brick.SIZE, Brick.SIZE);
    context.strokeRect(0, 0, Brick.SIZE, Brick.SIZE);

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Brick.SIZE, Brick.SIZE);
    context.moveTo(Brick.SIZE, 0);
    context.lineTo(0, Brick.SIZE);
    
    context.stroke();
    
  },

  createShapes: function(body, index) {
    
    var shapeDefinition = new b2PolygonDef();

    shapeDefinition.vertexCount = this.shapes[index].length;
    shapeDefinition.restitution = 0;
    shapeDefinition.friction = 0.9;

    for (var j = 0; j < this.shapes[index].length; j++) {
    
      shapeDefinition.vertices[j] = this.shapes[index][j];
    
    }

    if (this.isBroken) {
      shapeDefinition.density = 2;
    
      // collides only with stage not ball
      shapeDefinition.filter.maskBits = 0x0001;
    }

    body.CreateShape(shapeDefinition);
  },
  
  onCollision: function(contact) {
    
    if (this.timeoutID && (contact.shape1.GetBody().ballInstance || contact.shape2.GetBody().ballInstance)) {
      
      clearTimeout(this.timeoutID);
      this.timeoutID = 0;
    
    }
  },

  afterCollision: function(contact) {
    if (this.isBroken) {
      return;
    }
    
    if (contact.shape1.GetBody().ballInstance || contact.shape2.GetBody().ballInstance) {

      if (this.timeoutID) {

        clearTimeout(this.timeoutID);
        this.timeoutID = 0;

      }

      var myScope = this;

      this.timeoutID = setTimeout(function() {
        myScope.onTimeout();
      }, 200);
    }
  },
  
  onTimeout: function() {
    
    this.isBreaking = true;
    
    var rotateVector = function(vector, angle) {
      return new b2Vec2(
        vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
        vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
      );
    };
    
    var impulseVector = new b2Vec2(0, -Math.random() * 2);
    //var impulseVector = new b2Vec2(10, 0);
    
    for (var i = 0; i < this.bodies.length; i++) {
      
      this.bodies[i].ApplyImpulse(
        impulseVector, 
        this.bodies[i].GetPosition()
      );
      
      impulseVector = rotateVector(impulseVector, Math.PI / 2);
    }
    
    var myScope = this;
    
    setTimeout(function() {
      myScope.decrementAlpha();
    }, 100);
    
  },
  
  decrementAlpha: function() {
    
    if (this.alpha > 0 && this.isBroken) {
      this.alpha -= .05;
      
      var myScope = this;
      
      setTimeout(function() {
        myScope.decrementAlpha();
      }, 100);
    }
  },
  
  rotate: function() {
    return;
  }

});

Breaker.prototype.type = "Breaker";

Breaker.prototype.shapes = function () {
  
  var shapes = [];
  
  var middlePoint = new b2Vec2((Math.random() / 2) - 0.25, (Math.random() / 2) - 0.25);
  
  var outlinePoints = [
    new b2Vec2(-0.5, (Math.random() / 2) - 0.25),
    
    new b2Vec2(-0.5, -0.5),
    
    new b2Vec2(-Math.random() / 2, -0.5),
    new b2Vec2(Math.random() / 2, -0.5),
    
    new b2Vec2(0.5, -0.5),
    
    new b2Vec2(0.5, (Math.random() / 2) - 0.25),
    
    new b2Vec2(0.5, 0.5),
    
    new b2Vec2(-Math.random() / 2, 0.5),
    new b2Vec2(Math.random() / 2, 0.5),
    
    new b2Vec2(-0.5, 0.5)
  ];
  
  var vertexNumbers = [3, 2, 3, 3, 2, 3];
  
  var counter = 0;
  
  for (var i = 0; i < 6; i++) {
    
    var shape = [];
    
    shape.push(middlePoint);
    
    for (var j = 0; j < vertexNumbers[i]; j++) {
      
      shape.push(outlinePoints[counter % 10]);
      counter++;
      
    }
    
    counter--;
    
    shapes.push(shape);
    
  }
  
  return shapes;
  
}();