# make URL formatting function
import matplotlib.pyplot
import pandas
import io
import requests


def arrest_explorer(value='arrests', split='', su='',
                    sort='', format_table='tall',
                    base_url='https://icjia.illinois.gov/arrestexplorer/api',
                    **args):
    url = base_url + '/?value=' + value + '&format_table=' + format_table
    if su != '':
        url += '&' + su
    if split != '':
        if not isinstance(split, str):
            split = ','.join(split)
        args['split'] = split
    if sort != '':
        if not isinstance(sort, str):
            sort = ','.join(sort)
        args['sort'] = sort
    for k in args:
        url += '&' + k + '=' + args[k]
    print('reading in table from:\n', url)
    res = requests.get(url)
    if res.status_code != 200:
        print('request failed:\n', res.text)
    else:
        return pandas.read_csv(io.StringIO(res.text))


# load http, data, and plotting packages

# examples

# total arrests
arrests = arrest_explorer()
fig, ax = matplotlib.pyplot.subplots()
ax.plot('Year', 'arrests', data=arrests)
ax.set_title('Arrests by Year')
ax.set_ylabel('Arrests')
ax.set_xlabel('Year')

# How did arrest rates vary by sex?
arrests_by_sex = arrest_explorer(split='gender')
fig, ax = matplotlib.pyplot.subplots()
ax.bar('gender', 'arrests', data=arrests_by_sex)
ax.set_title('Arrests by Gender')
ax.set_ylabel('Arrests')
ax.set_xlabel('Gender')

# Over time, which age groups were most likely to be re-arrested?
rearrest_by_agegroup = arrest_explorer('arrests_per_arrestee', 'age_group')
fig, ax = matplotlib.pyplot.subplots()
for group in rearrest_by_agegroup.age_group.unique():
    ax.plot(
        'Year', 'arrests_per_arrestee', label=group,
        data=rearrest_by_agegroup[rearrest_by_agegroup.age_group == group]
    )
ax.set_title('Arrests Per Arrestee by Year between Age Group')
ax.set_ylabel('Arrests Per Arrestee')
ax.set_xlabel('Year')
ax.legend()

# What were people most frequently arrested for?
charge_by_category = arrest_explorer(
    'arrest_charges', 'offense_category',
    'offense_category[mean]>10000', 'offense_category[mean]'
)
fig, ax = matplotlib.pyplot.subplots()
ax.bar('offense_category', 'arrest_charges', data=charge_by_category)
matplotlib.pyplot.setp(ax.get_xticklabels(), rotation=40, ha='right')
ax.set_title('Arrest Charges by Offense Category')
ax.set_ylabel('Arrest Charges')
ax.set_xlabel('Offense Category')
