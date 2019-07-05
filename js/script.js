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

	
$("#loader").delay(1800).fadeOut("1000");

//FONT & IMG FADE IN

$('header').delay(2000).fadeIn(500).removeClass('hidden');



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
	
	'use strict';
	$('.exit').click(function(){
		$('.resp-menu').fadeOut(800);
	});
	
// responsive menu fade out on click

	
	$('.sub1').click(function(){
		$('.resp-menu').fadeOut(600);
	});
	




