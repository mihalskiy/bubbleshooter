var BubbleShoot = window.BubbleShoot || {};
BubbleShoot.width = window.innerWidth > 1000 ? 1000 : window.innerWidth;
BubbleShoot.height = window.innerHeight < 738 ? 738 : window.innerHeight;
BubbleShoot.Renderer = (function($){
	var canvas;
	var context;
	var spriteSheet;
	var background;
	var BUBBLE_IMAGE_DIM = 50;
	var Renderer = {
		init : function(callback){
			canvas = document.createElement("canvas");
			$(canvas).addClass("game_canvas");
			$("#game").prepend(canvas);
      $(canvas).attr("width",BubbleShoot.width);
      $(canvas).attr("height",BubbleShoot.height);
      $('#top_bar').css('width', BubbleShoot.width);
      context = canvas.getContext("2d");
			spriteSheet = new Image();
			spriteSheet.src = "_img/bubble_sprite_sheet.png";
      background = new Image();
      background.src = "http://i.imgur.com/yf6d9SX.jpg";
			spriteSheet.onload = function() {
				callback();
			};
      background.onload = function(){
        context.drawImage(background,0,0);
      }
		},
		render : function(bubbles){
			context.clearRect(0,0,canvas.width,canvas.height);
			context.translate(120,0);
			$.each(bubbles,function(){
				var bubble = this;
				var clip = {
					top : bubble.getType() * BUBBLE_IMAGE_DIM,
					left : 0
				};
					switch(bubble.getState()){
						case BubbleShoot.BubbleState.POPPING:
							var timeInState = bubble.getTimeInState();
							if(timeInState < 80){
								clip.left = BUBBLE_IMAGE_DIM;
								}else if(timeInState < 140){
								clip.left = BUBBLE_IMAGE_DIM*2;
								}else{
								clip.left = BUBBLE_IMAGE_DIM*3;
							};
							break;
						case BubbleShoot.BubbleState.POPPED:
							return;
						case BubbleShoot.BubbleState.FIRED:
							return;
						case BubbleShoot.BubbleState.FALLEN:
							return;
					}
				Renderer.drawSprite(bubble.getSprite(),clip);
			});
			context.translate(-120,0);
		},
		drawSprite : function(sprite,clip){
			context.translate(sprite.position().left + sprite.width()/2,sprite.
				position().top + sprite.height()/2);
			context.drawImage(spriteSheet,clip.left,clip.top,BUBBLE_IMAGE_DIM,
				BUBBLE_IMAGE_DIM,-sprite.width()/2,-sprite.height()/2,BUBBLE_IMAGE_DIM,
				BUBBLE_IMAGE_DIM);
			context.translate(-sprite.position().left - sprite.width()/2,
				-sprite.position().top - sprite.height()/2);
		}
	};
	return Renderer;
})(jQuery);
