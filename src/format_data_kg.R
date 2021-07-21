# This is KG's script that builds the data.json and levels.json objects except using
# Ernst Melchior's views, which is effectively the source of the arrest data for explorer.

# this code is intending primarily to translate that data into the JSON form that the arrest explorer app accepts.
# secondarily it can be used, via the low_N function, or future functions within it, to execute low N replacements.


# Load Libraries ----

library(data.table)
library(stringr)
library(jsonlite)
library(odbc)
library(foreach)

# Load Database Connections ----

SPAC2 <- dbConnect(odbc(),"SPAC2")

# custom function to quickly load from arrestexplorer as data.table, data.table is a dataframe
# but allows fast query, indexing, and space efficient syntax, recoding, etc.

SPAC <- function(view) {data.table(dbGetQuery(SPAC2, paste0("select * from ArrestExplorer.dbo.",view)) ) }

# Define variable standardization functions ----

# these are minimal at first, but can incorporate any per variable recodes needed to standardize
# initial release mimics output of Micah's code

age_relabel <- function(arrestagegroup){substr(arrestagegroup,5,11)}
county_std <- function(countyname){str_to_lower(countyname)}
gender_std <- function(gender){fcase(gender=='M','male',
                                    gender=='F','female')}
race_std <- function(racedescr){str_to_lower(racedescr)}
crimet_std <- function(crimetype){str_to_lower(crimetype)}
offcat_std <- function(offensecategory){str_to_lower(offensecategory)}
low_N  <- function(N){fcase(N=='(0-4)',as.double(1),
                            N=='(5-9)',as.double(6),
                            as.double(N) > 9 , as.double(N)
                        )}
offclass_std <- function(offclass){str_to_lower(offclass)}


# Load Data from SPAC -----

# each SPAC call retrieves the view as a data.table
# the [] is a data.table call, e.g. :
# [,.(arrests=arrestsreport18_99) ,keyby= .(x,y,z) ] sorts by the defined x,y,z recodes variables at load

# any and all variable/columns that are not invoked are de facto dropped, as this is essentially a SQL select.

# WARNING: the app expect everything to be consistently ordered by year, regardless of whether the year are in order
# consequently all present and future calls should by keyed by arrestyear.

#TODO: fix names, the use of county, year, etc is slightly inconsistent.

data_CHRI <- list(

  # arrests
  arrests_by_year = SPAC('vt1t')[,.(arrests=arrestsreported18_99),keyby=.(year=arrestyear)] ,
  arrests_by_year_age = SPAC('vt2t')[,.(arrests=arrestsreported18_99)
                                     ,keyby=.(year=arrestyear
                                            , age_group=age_relabel(arrestagegroup))] ,
  arrests_by_year_county = SPAC('vt3t')[,.(arrests=arrestsreported18_99)
                                        ,keyby=.(year=arrestyear,
                                                 county=county_std(countyname))] ,
  arrests_by_year_gender = SPAC('vt4t')[,.(arrests=arrestsreported18_99)
                                                ,keyby=.(year=arrestyear,
                                                         gender=gender_std(gender))] ,
  arrests_by_year_race = SPAC('vt5t')[,.(arrests=arrestsreported18_99)
                                     ,keyby=.(year=arrestyear,
                                              race=race_std(racedescr))] ,
  arrests_by_year_county_age = SPAC('vt6t')[,.(arrests=arrestsreported18_99)
                                           ,keyby=.(year=arrestyear,
                                                    county=county_std(countyname),
                                                    age_group=age_relabel(arrestagegroup))] ,
  arrests_by_year_age_gender = SPAC('vt7t')[,.(arrests=arrestsreported18_99)
                                            ,keyby=.(year=arrestyear,
                                                     age_group=age_relabel(arrestagegroup),
                                                     gender=gender_std(gender))] ,
  arrests_by_year_age_race = SPAC('vt8t')[,.(arrests=arrestsreported18_99)
                                          ,keyby=.(year=arrestyear,
                                                   age_group=age_relabel(arrestagegroup),
                                                   race=race_std(racedescr))] ,
  arrests_by_year_county_gender = SPAC('vt9t')[,.(arrests=arrestsreported18_99)
                                               ,keyby=.(year=arrestyear,
                                                        county=county_std(countyname),
                                                        gender=gender_std(gender))] ,
  arrests_by_year_county_race = SPAC('vt10t')[,.(arrests=arrestsreported18_99)
                                              ,keyby=.(year=arrestyear,
                                                       county=county_std(countyname),
                                                       race=race_std(racedescr))] ,
  arrests_by_year_gender_race = SPAC('vt11t')[,.(arrests=arrestsreported18_99)
                                              ,keyby=.(year=arrestyear,
                                                       gender=gender_std(gender),
                                                       race=race_std(racedescr))] ,
 #arrestees
  arrestees_by_year = SPAC('vt12t')[,.(arrestees=SidsReported_18_99)
                                    ,keyby=.(year=arrestyear)] ,
  arrestees_by_year_age = SPAC('vt13t')[,.(arrestees=SidsReported_18_99)
                                        ,keyby=.(year=arrestyear,
                                                 age_group=age_relabel(MinAgeGroup))] ,
  arrestees_by_year_county = SPAC('vt14t')[,.(arrestees=SidsReported_18_99)
                                           ,keyby=.(year=arrestyear,
                                                    county=county_std(countyname))]  ,
  arrestees_by_year_gender = SPAC('vt15t')[,.(arrestees=SidsReported_18_99)
                                           ,keyby=.(year=arrestyear,
                                                    gender=gender_std(MinGender))] ,
  arrestees_by_year_race = SPAC('vt16t')[,.(arrestees=SidsReported_18_99)
                                         ,keyby=.(year=arrestyear,
                                                  race=race_std(racedescr))] ,
  arrestees_by_county_age = SPAC('vt17t')[,.(arrestees=SidsReported_18_99)
                                          ,keyby=.(year=arrestyear,
                                                   county=county_std(countyname),
                                                   age_group=age_relabel(agegroup))] ,
  arrestees_by_age_gender = SPAC('vt18t')[,.(arrestees=SidsReported_18_99)
                                          ,keyby=.(year=arrestyear,
                                                   age_group=age_relabel(agegroup),
                                                   gender=gender_std(gender))]  ,
  arrestees_by_year_age_race = SPAC('vt19t')[,.(arrestees=SidsReported_18_99)
                                             ,keyby=.(year=arrestyear,
                                                      age_group=age_relabel(agegroup),
                                                      race=race_std(racedescr))] ,
  arrestees_by_year_county_gender = SPAC('vt20t')[,.(arrestees=SidsReported_18_99)
                                                  ,keyby=.(year=arrestyear,
                                                           county=county_std(countyname),
                                                           gender=gender_std(gender))] ,
  arrestees_by_year_county_race = SPAC('vt21t')[,.(arrestees=SidsReported_18_99)
                                                ,keyby=.(year=arrestyear,
                                                         county=county_std(countyname),
                                                         race=race_std(racedescr))] ,
  arrestees_by_gender_race = SPAC('vt22t')[,.(arrestees=SidsReported_18_99)
                                           ,keyby=.(year=arrestyear,
                                                    gender=gender_std(gender),
                                                    race=race_std(racedescr))]  ,


# arrests by max charge internally usually referred to as arrest_charge
  arrests_by_year_crimetype = SPAC('vt25t')[,.(arrests=arrestsreported18_99),
                                             keyby=.(year=arrestyear,
                                                     crime_type=crimet_std(crimetype))] ,
  arrests_by_year_offense = SPAC('vt26t')[,.(arrests=arrestsreported18_99),
                                         keyby=.(year=arrestyear,
                                                 offense_category=offcat_std(offensecategory))] ,
  arrests_by_year_offclass = SPAC('vt27t')[,.(arrests=arrestsreported18_99),
                                          keyby=.(year=arrestyear,
                                                  offense_class=offclass_std(OffenseClass))] ,
  arrests_by_year_county_crimetype = SPAC('vt28t')[,.(arrests=arrestsreported18_99),
                                                  keyby=.(year=arrestyear,
                                                          county=county_std(countyname),
                                                          crime_type=crimet_std(crimetype))] ,
  arrests_by_year_county_offense = SPAC('vt29t')[,.(arrests=arrestsreported18_99),
                                                        keyby=.(year=arrestyear,
                                                                county=county_std(countyname),
                                                                offense_category=offcat_std(OffenseCategory))] ,
  arrests_by_year_county_offclass = SPAC('vt30t')[,.(arrests=arrestsreported18_99),
                                                 keyby=.(year=arrestyear,
                                                         county=county_std(countyname),
                                                         offense_class=offclass_std(OffenseClass))] ,
  arrests_by_year_crimetype_offclass = SPAC('vt31t')[,.(arrests=arrestsreported18_99),
                                               keyby=.(year=arrestyear,
                                                       crime_type=crimet_std(crimetype),
                                                       offense_class=offclass_std(OffenseClass))] ,
  arrests_by_year_offense_offclass = SPAC('vt32t')[,.(arrests=arrestsreported18_99),
                                                  keyby=.(year=arrestyear,
                                                          offense_category=offcat_std(OffenseCategory),
                                                          offense_class=offclass_std(OffenseClass))]
  )


# Load static Level Definitions files and write levels.json -----

# Micah's original scripts read variable and level definitions dynamically from the input tables
# in practice this is largely not needed, as major changes to the incoming data are things that
# staff should be aware of, and more than likely will require changes to.

# Notably the top level variables from that perspective, are excluded: arrests, arrestees, and arrest_charges

# That leaves the breaking variables to be defined:

# county, crime_type, offense_category, offese_class, race, age_group, gender

# each is defined via three columns, these are used partly by the documentation site and partly by the user
# interface.

# col 1:  label   - this is the text as shown in the UI, note that the UI matches to this based on lowercase
#                 - so that in practice it has minimal utility excepts that it can serve to capitalize DuPage, etc.
# col 2:  index   - this essentially reflects the original order in the original data submissions,
#                   it potentially could be used by the UI to sort, but it effectively ignored.
# col 3:  code    - codes used inside of CHRI, provided for reference. These can be used by the API, but are no longer
#                   shown on the front end.

levels.json <- list(
county = fread('county.csv'),
crime_type = fread('crime_type.csv'),
offense_category = fread('offense_category.csv'),
offense_class = fread('offense_class.csv'),
race = fread('race.csv'),
age_group = fread('age_group.csv'),
gender = fread('gender.csv'))

write_json(levels.json, 'levels.json')
write_json(lapply(levels.json, function(l) lapply(as.list(l), as.character)), 'levels.json')
# Define data.json object -----

# TODO : Define custom functions and refactor/clean the code
# presently these use a working brute force method.

# This section relies on two restructing processes repeatedly that require additional work
# to implement as functions, because they would involve building the names of objects that already exist
# as strings and then calling those objects etc.

# function 1: convert data.table x to format year by x$variable and drop the years column
# generally dcast(x, year ~ varA)[,.SD[,2:ncol(.SD)]] where the [ etc .] just drops the first column by selecting 2 to the max column

# col_by_year_wo_year <- function(DT, col_var, year_var='year') {
#
#   dcast(DT, get(year_var) ~ (get(col_var)) )[,.SD[,2:ncol(.SD)]]
#
# }

col_by_year_wo_year_lowN <- function(DT, col_var, year_var='year') {

  output <- dcast(DT, get(year_var) ~ (get(col_var)) )[,.SD[,2:ncol(.SD)]]

  #this should apply the low N function
  for(j in colnames(output)) set(output, j=j, value = low_N(output[[j]]))

  output
}

# functions 2: break a data.table DT into a list of smaller tables based on a variable, then apply function 1 for a second variable within
#  each subtable
# quickcast <- function(DT, var, var2) {foreach(selected = DT[,unique(var)] ,
#                      .combine = c
# ) %do% {
#   a <- list()
#   a[[select]] <- DT[var==selected, dcast(.SD, year ~ var)[,.SD[,2:ncol(.SD)]] ]
#   a}}


list_by_x_col_y <- function(DT, list_var , col_var  )
{
  foreach(each_list_level = DT[,unique(get(list_var))],
          .combine = c) %do% {
            #because we have to build a list of lists, we have to initialize list, this could maybe be better optimized

            build_list <- list()
            build_list[[each_list_level]] <- DT[get(list_var)==each_list_level ,col_by_year_wo_year_lowN(.SD, as.character(col_var) )]
            build_list


          }



}


### test function 1
# returns totals by year by county without year as explicit variable
col_by_year_wo_year(data_CHRI$arrestees_by_year_county, 'county')

### test function 2
list_by_x_col_y(data_CHRI$arrests_by_year_county_race, 'county','race')

# optionally a third function and / or set of for reach loops could be called to read data_CHRI
# by object name and break it into the table, this would be useful for increasing visible systematic
# processing.



# this mimics the format of l1nest from Micah's code
# there is very likely a more efficient way to do this, but opting for traceability
# for the time being
data.json <- list(

  ## arrests definitions ----

  arrests = list(
    county = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_county, 'county'),
                  race = list_by_x_col_y(data_CHRI$arrests_by_year_county_race, 'county', 'race'),
                  age_group = list_by_x_col_y(data_CHRI$arrests_by_year_county_age, 'county', 'age_group'),
                  gender = list_by_x_col_y(data_CHRI$arrests_by_year_county_gender, 'county', 'gender')),

    race = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_race, 'race')),

    gender = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_gender, 'gender'),
                  race =  list_by_x_col_y(data_CHRI$arrests_by_year_gender_race,'gender','race')),

    age_group =list( total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_age, 'age_group'),
                     gender = list_by_x_col_y(data_CHRI$arrests_by_year_age_gender, 'age_group', 'gender'),
                     race = list_by_x_col_y(data_CHRI$arrests_by_year_age_race, 'age_group', 'race'))
                  ,
    total = data_CHRI$arrests_by_year$arrests
  ),


## arrestees defintions ----


                   arrestees = list(
                     age_group = list(total = col_by_year_wo_year_lowN(data_CHRI$arrestees_by_year_age, 'age_group'),
                                      gender = list_by_x_col_y(data_CHRI$arrestees_by_age_gender,'age_group', 'gender'),
                                      race = list_by_x_col_y(data_CHRI$arrestees_by_year_age_race, 'age_group', 'race')),
                     county = list(total = col_by_year_wo_year_lowN(data_CHRI$arrestees_by_year_county, 'county'),
                                   age_group = list_by_x_col_y(data_CHRI$arrestees_by_county_age, 'county', 'age_group') ,
                                   gender = list_by_x_col_y(data_CHRI$arrestees_by_year_county_gender, 'county', 'gender')

                                     ,
                                   race = list_by_x_col_y(data_CHRI$arrestees_by_year_county_race, 'county', 'race')),
                     gender = list(
                       total = col_by_year_wo_year_lowN(data_CHRI$arrestees_by_year_gender, 'gender'),
                       race = list_by_x_col_y(data_CHRI$arrestees_by_gender_race, 'gender', 'race')
                                    ),
                     race = list(total = col_by_year_wo_year_lowN(data_CHRI$arrestees_by_year_race, 'race')),
                     total = data_CHRI$arrestees_by_year$arrestees
                   ),


## arrest_charges defintions ----


                   arrest_charges = list(
                     county =  list( total = col_by_year_wo_year_lowN( data_CHRI$arrests_by_year_county, 'county'),
                                     crime_type = list_by_x_col_y(data_CHRI$arrests_by_year_county_crimetype, 'county', 'crime_type'),
                                     offense_category =  list_by_x_col_y(data_CHRI$arrests_by_year_county_offense, 'county', 'offense_category'),
                                     offense_class = list_by_x_col_y(data_CHRI$arrests_by_year_county_offclass, 'county', 'offense_class')),
                     crime_type = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_crimetype, 'crime_type'),
                                       offense_class = list_by_x_col_y(data_CHRI$arrests_by_year_crimetype_offclass, 'crime_type', 'offense_class')

                                        ) ,
                     offense_category = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_offense, 'offense_category'),
                                             offense_class = list_by_x_col_y( data_CHRI$arrests_by_year_offense_offclass, 'offense_category', 'offense_class')
                                             ),
                     offense_class = list(total = col_by_year_wo_year_lowN(data_CHRI$arrests_by_year_offclass, 'offense_class')) ,
                     total = data_CHRI$arrests_by_year$arrests  ) ,

## final vectors in data -----
                   year = data_CHRI$arrests_by_year$year, # because everything indexed by year, should be valid
                   version = Sys.Date()





)

write_json(data.json, 'data.json', auto_unbox = TRUE, dataframe = 'columns')



