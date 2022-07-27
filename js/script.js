 // JavaScript Document

// THE AMAZING DISAPPEARING NAV EFFECT - REAPPEAR ON SCROLL 300 TOP
   $(window).resize(function() {
'use strict';
   $("wrapper").height($(window).height());
   });

   (function ($) {
     $(document).ready(function(){
       $(function () {
         $(window).scroll(function () {
           if ($(this).scrollTop() > 300) {
              $('.header1').fadeOut();
           } else {
              $('.header1').fadeIn();} 
       });
    });   	   
});   
}(jQuery));

	
$("#loader").delay(800).fadeOut("800");
/*$("#loader").delay(100).fadeOut("100");*/
//FONT & IMG FADE IN

$('header').delay(800).fadeIn(500).removeClass('hidden');



// Smooth scroll effect by ancoring

$('a').click(function(){
	'use strict';
	$('html, body').animate({
		scrollTop: $( $.attr(this, 'href') ).offset().top
	}, 1200);
	return false;
});
// Responsive menu

	
	$('.resp-men-but').click(function(){
		$('.resp-menu').fadeToggle(600);
	});
	
	$('.exit').click(function(){
		$('.resp-menu').fadeOut(800);
	});
	
// responsive menu fade out on click

	
	//$('.sub1').click(function(){
		//$('.resp-menu').fadeOut(600);
	//});
	




