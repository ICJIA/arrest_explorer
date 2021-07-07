# This is KG's script that builds the data.json and levels.json objects except using
# Ernst Melchior's views, the original source of the arrest data for explorer.

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
                            N>9,as.double(N)
                        )}
offclass_std <- function(offclass){str_to_lower(offclass)}


# Load Data from SPAC -----

# each SPAC call retrieves the view as a data.table
# the [] is a data.table call [
#                               ,.(arrests=arrestsreport18_99)
#                               ,keyby= .(x,y,z) ] this sorts by the defined x,y,z recodes variables at load
# any and all variable/columns that are not invoked are dropped.

#TODO: fix names, a few have arrest as singular, other like year,etc.

data_CHRI <- list(

  # arrests
  arrests_by_year = SPAC('vt1t')[,.(arrests=arrestsreported18_99),keyby=.(year=arrestyear)] ,
  arrests_by_year_age = SPAC('vt2t')[,.(arrests=arrestsreported18_99)
                                     ,keyby=.(year=arrestyear
                                            , age_group=age_relabel(arrestagegroup))] ,
  arrests_by_year_county = SPAC('vt3t')[,.(arrests=arrestsreported18_99)
                                        ,keyby=.(year=arrestyear,
                                                 county=county_std(countyname))] ,
  arrest_by_year_gender = SPAC('vt4t')[,.(arrests=arrestsreported18_99)
                                                ,keyby=.(year=arrestyear,
                                                         gender=gender_std(gender))] ,
  arrest_by_year_race = SPAC('vt5t')[,.(arrests=arrestsreported18_99)
                                     ,keyby=.(year=arrestyear,
                                              race=race_std(racedescr))] ,
  arrest_by_year_county_age = SPAC('vt6t')[,.(arrests=arrestsreported18_99)
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
  arrest_by_year_crimetype = SPAC('vt25t')[,.(arrests=arrestsreported18_99),
                                             keyby=.(year=arrestyear,
                                                     crime_type=crimet_std(crimetype))] ,
  arrest_by_year_offense = SPAC('vt26t')[,.(arrests=arrestsreported18_99),
                                         keyby=.(year=arrestyear,
                                                 offense_category=offcat_std(offensecategory))] ,
  arrest_by_year_offclass = SPAC('vt27t')[,.(arrests=arrestsreported18_99),
                                          keyby=.(year=arrestyear,
                                                  offense_class=offclass_std(OffenseClass))] ,
  arrest_by_year_county_crimetype = SPAC('vt28t')[,.(arrests=arrestsreported18_99),
                                                  keyby=.(year=arrestyear,
                                                          county=county_std(countyname),
                                                          crime_type=crimet_std(crimetype))] ,
  arrest_by_year_county_offense = SPAC('vt29t')[,.(arrests=arrestsreported18_99),
                                                        keyby=.(year=arrestyear,
                                                                county=county_std(countyname),
                                                                offense_category=offcat_std(OffenseCategory))] ,
  arrest_by_year_county_offclass = SPAC('vt30t')[,.(arrests=arrestsreported18_99),
                                                 keyby=.(year=arrestyear,
                                                         county=county_std(countyname),
                                                         offense_class=offclass_std(OffenseClass))] ,
  arrest_by_year_crimetype_offclass = SPAC('vt31t')[,.(arrests=arrestsreported18_99),
                                               keyby=.(year=arrestyear,
                                                       crime_type=crimet_std(crimetype),
                                                       offense_class=offclass_std(OffenseClass))] ,
  arrest_by_year_offense_offclass = SPAC('vt32t')[,.(arrests=arrestsreported18_99),
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

# functions 2: break a data.table DT into a list of smaller tables based on a variable, then apply function 1 for a second variable within
#  each subtable
# quickcast <- function(DT, var, var2) {foreach(selected = DT[,unique(var)] ,
#                      .combine = c
# ) %do% {
#   a <- list()
#   a[[select]] <- DT[var==selected, dcast(.SD, year ~ var)[,.SD[,2:ncol(.SD)]] ]
#   a}}


# optionally a third function and / or set of for reach loops could be called to read data_CHRI
# by object name and break it into the table, this would be useful for increasing visible systematic
# processing.



# this mimics the format of l1nest from Micah's code
# there is very likely a more efficient way to do this, but opting for traceability
# for the time being
data.json <- list(

  ## arrests definitions ----

  arrests = list(
    county = list(total = dcast(data_CHRI$arrests_by_year_county, year ~ county)[,.SD[,2:ncol(.SD)]],
                  race = foreach(sel_county = data_CHRI$arrests_by_year_county_race[,unique(county)] ,
                                 .combine = c
                                   ) %do% {
                                     a <- list()
                                     a[[sel_county]] <- data_CHRI$arrests_by_year_county_race[county==sel_county, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                                     a},
                  age_group = foreach(sel_county = data_CHRI$arrest_by_year_county_age[,unique(county)] ,
                                      .combine = c
                                  ) %do% {
                                    a <- list()
                                    a[[sel_county]] <- data_CHRI$arrest_by_year_county_age[county==sel_county, dcast(.SD, year ~ age_group)[,.SD[,2:ncol(.SD)]] ]
                                    a},
                  gender = foreach(sel_county = data_CHRI$arrests_by_year_county_gender[,unique(county)] ,
                                   .combine = c
                                  ) %do% {
                                    a <- list()
                                    a[[sel_county]] <- data_CHRI$arrests_by_year_county_gender[county==sel_county, dcast(.SD, year ~ gender)[,.SD[,2:ncol(.SD)]] ]
                                    a}

                        ),
    race = list(total = dcast(data_CHRI$arrest_by_year_race, year ~ race)[,.SD[,2:ncol(.SD)]]

                  ),
    gender = list(total =dcast(data_CHRI$arrest_by_year_gender, year ~ gender)[,.SD[,2:ncol(.SD)]],
                  race = foreach(sel_gender = data_CHRI$arrests_by_year_gender_race[,unique(gender)] ,
                                 .combine = c
                  ) %do% {
                    a <- list()
                    a[[sel_gender]] <- data_CHRI$arrests_by_year_gender_race[gender==sel_gender, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                    a} ),
    age_group =list( total = dcast(data_CHRI$arrests_by_year_age, year ~ age_group)[,.SD[,2:ncol(.SD)]]
                       ,
                     gender = foreach(sel_age = data_CHRI$arrests_by_year_age_gender[,unique(age_group)] ,
                                      .combine = c
                     ) %do% {
                       a <- list()
                       a[[sel_age]] <- data_CHRI$arrests_by_year_age_gender[age_group==sel_age, dcast(.SD, year ~ gender)[,.SD[,2:ncol(.SD)]] ]
                       a}
                       ,
                     race = foreach(sel_age = data_CHRI$arrests_by_year_age_race[,unique(age_group)] ,
                                    .combine = c
                     ) %do% {
                       a <- list()
                       a[[sel_age]] <- data_CHRI$arrests_by_year_age_race[age_group==sel_age, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                       a} )
                       ,
    total = data_CHRI$arrests_by_year$arrests




  ),


## arrestees defintions ----


                   arrestees = list(
                     age_group = list(total = dcast(data_CHRI$arrestees_by_year_age, year ~ age_group)[,.SD[,2:ncol(.SD)]],
                                      gender = foreach(sel_age = data_CHRI$arrestees_by_age_gender[,unique(age_group)] ,
                                                       .combine = c
                                      ) %do% {
                                        a <- list()
                                        a[[sel_age]] <- data_CHRI$arrestees_by_age_gender[age_group==sel_age, dcast(.SD, year ~ gender)[,.SD[,2:ncol(.SD)]] ]
                                        a} ,
                                      race = foreach(sel_age = data_CHRI$arrestees_by_year_age_race[,unique(age_group)] ,
                                                     .combine = c
                                      ) %do% {
                                        a <- list()
                                        a[[sel_age]] <- data_CHRI$arrestees_by_year_age_race[age_group==sel_age, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                                        a}),
                     county = list(total = dcast(data_CHRI$arrestees_by_year_county, year ~ county)[,.SD[,2:ncol(.SD)]],
                                   age_group = foreach(sel_county = data_CHRI$arrestees_by_county_age[,unique(county)] ,
                                                       .combine = c
                                   ) %do% {
                                     a <- list()
                                     a[[sel_county]] <- data_CHRI$arrestees_by_county_age[county==sel_county, dcast(.SD, year ~ age_group)[,.SD[,2:ncol(.SD)]] ]
                                     a} ,
                                   gender = foreach(sel_county = data_CHRI$arrestees_by_year_county_gender[,unique(county)] ,
                                                    .combine = c
                                   ) %do% {
                                     a <- list()
                                     a[[sel_county]] <- data_CHRI$arrestees_by_year_county_gender[county==sel_county, dcast(.SD, year ~ gender)[,.SD[,2:ncol(.SD)]] ]
                                     a} ,
                                   race = foreach(sel_county = data_CHRI$arrestees_by_year_county_race[,unique(county)] ,
                                                  .combine = c
                                   ) %do% {
                                     a <- list()
                                     a[[sel_county]] <- data_CHRI$arrestees_by_year_county_race[county==sel_county, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                                     a}  ),
                     gender = list(
                       total = dcast(data_CHRI$arrestees_by_year_gender, year ~ gender)[,.SD[,2:ncol(.SD)]]
                       ,
                       race = foreach(sel_gender= data_CHRI$arrestees_by_gender_race[,unique(gender)] ,
                                      .combine = c
                       ) %do% {
                         a <- list()
                         a[[sel_gender]] <- data_CHRI$arrestees_by_gender_race[gender==sel_gender, dcast(.SD, year ~ race)[,.SD[,2:ncol(.SD)]] ]
                         a}
                     ),
                     race = list(total = dcast(data_CHRI$arrestees_by_year_race, year ~ race)[,.SD[,2:ncol(.SD)]]),
                     total = data_CHRI$arrestees_by_year$arrestees



                   ),


## arrest_charges defintions ----


                   arrest_charges = list(
                     county =  list( total = dcast(data_CHRI$arrests_by_year_county, year ~ county)[,.SD[,2:ncol(.SD)]],
                                     crime_type = foreach(sel_county = data_CHRI$arrest_by_year_county_crimetype[,unique(county)] ,
                                                          .combine = c
                                     ) %do% {
                                       a <- list()
                                       a[[sel_county]] <- data_CHRI$arrest_by_year_county_crimetype[county==sel_county, dcast(.SD, year ~ crime_type)[,.SD[,2:ncol(.SD)]] ]
                                       a},
                                     offense_category =  foreach(sel_county = data_CHRI$arrest_by_year_county_offense[,unique(county)] ,
                                                                 .combine = c
                                     ) %do% {
                                       a <- list()
                                       a[[sel_county]] <- data_CHRI$arrest_by_year_county_offense[county==sel_county, dcast(.SD, year ~ offense_category)[,.SD[,2:ncol(.SD)]] ]
                                       a},
                                     offense_class = foreach(sel_county = data_CHRI$arrest_by_year_county_offclass[,unique(county)] ,
                                                             .combine = c
                                     ) %do% {
                                       a <- list()
                                       a[[sel_county]] <- data_CHRI$arrest_by_year_county_offclass[county==sel_county, dcast(.SD, year ~ offense_class)[,.SD[,2:ncol(.SD)]] ]
                                       a}

                                     ),
                     crime_type = list(total = dcast(data_CHRI$arrest_by_year_crimetype, year ~ crime_type )[,.SD[,2:ncol(.SD)]],
                                       offense_class = foreach(sel_crimet = data_CHRI$arrest_by_year_crimetype_offclass[,unique(crime_type)] ,
                                                               .combine = c
                                       ) %do% {
                                         a <- list()
                                         a[[sel_crimet]] <- data_CHRI$arrest_by_year_crimetype_offclass[crime_type==sel_crimet, dcast(.SD, year ~ offense_class)[,.SD[,2:ncol(.SD)]] ]
                                         a} ) ,
                     offense_category = list(total = dcast(data_CHRI$arrest_by_year_offense, year ~ offense_category)[,.SD[,2:ncol(.SD)]] ,

                                             offense_class = foreach(sel_offcat = data_CHRI$arrest_by_year_offense_offclass[,unique(offense_category)] ,
                                                                     .combine = c
                                             ) %do% {
                                               a <- list()
                                               a[[sel_offcat]] <- data_CHRI$arrest_by_year_offense_offclass[offense_category==sel_offcat, dcast(.SD, year ~ offense_class)[,.SD[,2:ncol(.SD)]] ]
                                               a}

                                             ),
                     offense_class = list(total = dcast(data_CHRI$arrest_by_year_offclass, year ~ offense_class)[,.SD[,2:ncol(.SD)]] ) ,
                     total = data_CHRI$arrests_by_year$arrests  ) ,

## final vectors in data -----
                   year = data_CHRI$arrests_by_year$year, # because everything indexed by year, should be valid
                   version = Sys.Date()





)

write_json(data.json, 'data.json', auto_unbox = TRUE, dataframe = 'columns')



