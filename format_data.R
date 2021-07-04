# this script converts the .csv files exported from the
# SQL database to the JSON file used by the app
# ../data/updated should contain exported files (e.g., "arrests_Table 2 Transmit.csv")

# read in each file containing a table
files = list.files('../data/updated', full.names = TRUE)
data = lapply(files, read.csv)

#
# extract and standardize levels
# creates src/levels.json
#

# specify excluded columns
exclude = c('region', 'race', 'countycode', 'ucrcat', 'supercat', 'coocrating', 'crimetypesort', 'CoocLowZRating')

# specify variables to select, and map their names
vars = c(
  crimetype = 'supercat',
  offensecategory = 'ucrcat',
  OffenseClass = 'coocrating',
  countyname = 'countycode',
  racedescr = 'race',
  agegroup = 'agegroup'
)

# make a function to standardize label names
format_label = function(l){
  gsub('(?<=\\b)(\\w)', '\\U\\1', gsub('_', ' ', tolower(l), fixed = TRUE), perl = TRUE)
}

# make empty reference list to be filled with variable level information
refs = list()

# collect specified variables extract standardized level information
for(d in data) if(any(vars %in% colnames(d))){
  su = vars[vars %in% colnames(d)][1]
  if(names(su) %in% colnames(d)){
    sd = gsub('Age ', '', unique(do.call(paste, c(d[, c(su, names(su))], sep = '.'))), fixed = TRUE)
    refs[[names(su)]] = data.frame(label = format_label(sub('^[^.]+\\.', '', sd)), index = seq_along(sd) - 1, code = sub('\\..*$', '', sd))
    rownames(refs[[names(su)]]) = sub('^[^.]+\\.', '', sd)
  }
}

# standardize variable names for display
names(refs) = gsub('(?<=\\w)(group|category|class|type|charges)', '_\\1',
  gsub('descr$|name$', '', tolower(names(refs))), perl = TRUE)

# add levels for a gender variable
refs$gender = data.frame(label = c('Female', 'Male'), index = c(0, 1), code = c('F', 'M'))

# write levels file
jsonlite::write_json(lapply(refs, function(l) lapply(as.list(l), as.character)), 'src/levels.json')

#
# reformat and combine tables
# creates src/data.json
#

# make a function to convert tall groups (within tables) to wide
split_groups = function(d){
  nc = ncol(d)
  d = split(d, d[, nc - 1])
  as.data.frame(vapply(d, '[[', d[[1]][, nc], nc)[seq(nrow(d[[1]]), 1),])
}

# make a function to convert tall tables (including groups) to wide
split_table = function(d){
  d = d[, !colnames(d) %in% exclude]
  colnames(d) = gsub('(?<=\\w)(group|category|class|type|charges)', '_\\1',
      sub('^.*ids.*$', 'arrestees',
        gsub('reported18_99|arrests?|descr$|name$|^min', '',
          sub('^.*arrestsrep.*$', 'arrestcharges',
            tolower(colnames(d))))), perl = TRUE)
  nc = ncol(d)
  for(i in seq_len(nc)) if(is.character(d[, i])){
    d[, i] = tolower(d[, i])
    if(all(unique(d[, i]) %in% c('f', 'm'))){
      d[d[, i] == 'f', i] = 'female'
      d[d[, i] == 'm', i] = 'male'
    }else if(any(grepl('age', d[, i]))) d[, i] = sub('^age ', '', d[, i])
  }
  if(nc > 5){
    d = d[, -c(2, 4)]
    nc = ncol(d)
  }
  r = list(if(nc == 2){
    r = data.frame(d[seq(nrow(d), 1), 2])
    colnames(r) = 'total'
    r
  }else if(nc == 3){
    split_groups(d)
  }else{
    lapply(split(d, d[, 2]), split_groups)
  })
  names(r) = paste(colnames(d)[if(nc > 3) 2:3 else 2], collapse = '$')
  r
}

# convert format of data tables, and prepend value names
split_data = list()
for(d in data) split_data = c(split_data, split_table(d))
names(split_data) = paste0(gsub('^.*/|\\_.*$', '', files), '$', names(split_data))
names(split_data) = sub('arrestcharges', 'arrest_charges', names(split_data))

# remove variable names from base table names
base_names = c(
  arrests = 'arrests$charges',
  arrestees = 'arrestees$arrestees',
  arrest_charges = 'arrest_charges$charges'
)
names(split_data) = sub('^([^$]*)\\$(?:charges|arrestees)', '\\1', names(split_data))

# add year variable
split_data$year = rev(data[[1]][, 'arrestyear'])

# convert tables to final 1-3 level combination forms, and write data file
l1nest = list()
for(tab in c('arrests', 'arrestees', 'arrest_charges')){
  l1nest[[tab]] = list()
  tl = split_data[grep(paste0('^', tab), names(split_data))]
  names(tl) = sub('^[^$]*\\$', '', names(tl))
  tl[[1]] = tl[[1]][, 1]
  names(tl)[1] = 'total'
  for(s in unique(unlist(strsplit(names(tl), '$', fixed = TRUE)))[-1]){
    l1nest[[tab]][[s]] = tl[grep(paste0('^', s), names(tl))]
    names(l1nest[[tab]][[s]]) = sub('^.*\\$', '', names(l1nest[[tab]][[s]]))
    if(s %in% names(l1nest[[tab]][[s]])){
      names(l1nest[[tab]][[s]]) = sub(s, 'total', names(l1nest[[tab]][[s]]), fixed = TRUE)
    }
  }
  l1nest[[tab]]$total = split_data[[tab]]$total
}
l1nest$year = split_data$year
l1nest$version = format(file.info(files[1])$mtime, format = '%m/%d/%Y')
jsonlite::write_json(l1nest, 'src/data.json', auto_unbox = TRUE, dataframe = 'columns')

# replaced strings with numbers where possible
writeLines(gsub('"(\\d+)"(?=[,\\]])', '\\1', readLines('src/data.json'), perl = TRUE), 'src/data.json')
