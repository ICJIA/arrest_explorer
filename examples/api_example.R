# make URL formatting function
arrest_explorer = function(value = 'arrests', split = '', su = '', sort = '',
  format_table = 'tall', ...,
  base_url = 'https://icjia.illinois.gov/arrestexplorer/api'){
  url = paste0(base_url, '/?value=', value, '&format_table=', format_table)
  if(su != '') url = paste0(url, '&', su)
  args = c(list(
    split = paste(split, collapse = ','),
    sort = paste(sort, collapse = ',')
  ), as.list(substitute(...())))
  for(p in names(args)) if(args[[p]] != ''){
    url = paste0(url, '&', p, '=', args[[p]])
  }
  message('reading in table from:\n', url)
  read.csv(url)
}

# load plotting package
if(!require(splot)){
  install.packages('splot')
  library(splot)
}

# examples

## total arrests
arrests = arrest_explorer()
splot(arrests ~ Year, arrests, line = 'connected', mar = c(2, 4, 0, 0))

## How did arrest rates vary by sex?
arrests_by_sex = arrest_explorer(split = 'gender')
splot(arrests ~ gender, arrests_by_sex, type = 'bar', mar = c(2, 4, 0, 0))

## Over time, which age groups were most likely to be re-arrested?
rearrest_by_agegroup = arrest_explorer('arrests_per_arrestee', 'age_group')
splot(
  arrests_per_arrestee ~ Year * age_group, rearrest_by_agegroup,
  line = 'connected', myl = c(1.05, 1.35), leg = 'outside'
)

## What were people most frequently arrested for?
charge_by_category = arrest_explorer(
  'arrest_charges', 'offense_category',
  'offense_category[mean]>10000', 'offense_category[mean]'
)
splot(
  arrest_charges ~ offense_category, charge_by_category,
  sort = TRUE, type = 'bar', mar = c(2, 4, 0, 0)
)
