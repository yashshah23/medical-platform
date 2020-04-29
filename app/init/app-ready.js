/*global $*/
//JQuery
$(function() {
	$('.sidenav').sidenav({
		closeOnClick: true
	});
	
	$(document).ready(function(){
    	$('.collapsible').collapsible();
	});	
	
	$('select').formSelect();
});

function clearFieldType(){
	$(function(){
		$(".select-dropdown.dropdown-trigger")[0].value = "Choose your option";
	})
}

function selectedFieldType(title){
	$(function(){
		$(".select-dropdown.dropdown-trigger")[0].value=title ;
	})

}

function clearFieldSourceItem(){
	$(function(){
		 
		$("#fieldSourceItem")[0].value = "";
	})
}

$( "#title" ).focus();

function validDate(){
	$(function(){
		var now = new Date();
		var day = ("0" + now.getDate()).slice(-2);
		var month = ("0" + (now.getMonth() + 1)).slice(-2);
		var today = now.getFullYear()+"-"+(month)+"-"+(day) ;
		$("[id$='forfuturedatesdisable']").attr('max', today);
		
		
	});
}

