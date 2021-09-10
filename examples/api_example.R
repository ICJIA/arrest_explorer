# ICJIA CHRI Arrest Explorer API example in R

library(data.table) # this merely provides the fread package, tidyverse or the base csv read would also work
library(ggplot2) # the most widely plot, merely used to demonstrate the simplicity of plotting the data in R

# this example defines a custom function in R that eases use of the API

CHRI_api <- function(value = 'arrests',

                     # value options are
                     # arrests
                     # arrestees
                     # arrests_per_arrestee
                     # arrest_charges

                     split = '',

                     # one or two arguments as string seperated by
                     # variables
                     # county, crime_type, offense_category
                     # offense_class, race, age_group, gender

                     #arguments can be filtered using "attributes"/"aspects"

                     # label, max, min, sum, mean

                     # e.g. instead of offense_class, offense_class[mean]>1000

                     su = '',


                     # filter arguments, using same variables as split argument
                     # arguments can be filtered using
                     # label, max, min, sum, mean

                     # e.g. instead of offense_class, offense_class[mean]>1000

                     sort = '',

                     # +/- variable[attribute] and ordered
                     # e.g. county, -race[mean]


                     format_table = 'tall',

                     # tall, mixed, wide

                     ..., # advanced function see substitute call below

                      base_url = 'https://icjia.illinois.gov/arrestexplorer/api')


{
  #put a valid URL together from the above function call
  url <-  paste0(base_url, '/?value=', value, '&format_table=', format_table)
 # if there any filter su arguments, insert them into the above.
  if(su != '') url = paste0(url, '&', su)

 # process additional ... arguments into the call
  args = c(list(
    split = paste(split, collapse = ','),
    sort = paste(sort, collapse = ',')
  ), as.list(substitute(...())))

  for (p in names(args)) if (args[[p]] != '')
    {
    url = paste0(url, '&', p, '=', args[[p]])
  }

  # provider user feedback showing the URL
  message('reading in table from:\n', url)

  # read the url in, the API returns a CSV, fread is a very fast csv read function that outputs
  # a data.table type of dataframe.
  fread(url)
}

arrests <- CHRI_api() # without arguments the CHRI_api will return annual total arrests
# an example of how to plot this data using the common ggplot function
ggplot(data = arrests, mapping = aes(x=Year, y = arrests)) + geom_line()

# demonstration of a call for arrestees by gender
working_call <- CHRI_api(value = 'arrestees',split='gender')

# this is a counterexample, and will fail because the su argument is invalid
arresstees_by_gender_race_incorrectly <- CHRI_api(value = 'arrestees',split='gender', su = 'race=White')

# this API was built to be quite conservative about accepting incorrect input

# the final example is based on the below string, which was copied from the UI using the export menu
# https://icjia.illinois.gov/arrestexplorer/api/?format_table=tall&value=arrestees&split=race,county&county[label]=douglas,dupage,edgar,edwards


# this replicates the above call in the API
test <- CHRI_api(value = 'arrestees', split ='race,county', su = 'county[label]=champaign,dupage,edgar,edwards')

# Note that there are also options in the API such as &format_category=indices which returns numeric codes instead of text labels, and can be inserted into the
# the URL.
