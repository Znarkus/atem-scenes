'use strict'

import $ from 'jquery'

$.get('/config', r => {
  $('#top').text(`ATEM on ${r.atem.ip}`)
})


$('.states button').click(function () {
  $.post('/state/' + $(this).attr('id') + '/' + getOptions())
})

$('#go').click(function () {
  $.post('/go/' + getOptions())
})

function getOptions () {
  return $('#with_parents').is(':checked') ? 'with_parents' : 'without_parents'
}
