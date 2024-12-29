import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { RadioButton, TextInput, Button, Text } from 'react-native-paper';
import { DatePickerInput } from 'react-native-paper-dates';
import LocationScanner from './location-scanner';
import type { DocumentFormData } from '../types/form';
import { enGB, registerTranslation } from 'react-native-paper-dates';
registerTranslation('en-GB', enGB);

const DocumentForm = () => {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    defaultValues: {
      location: '',
      noOfEmployee: '',
      company: '',
      reportingDate: undefined,
      dailyWorkingHours: '',
      noOfMaleWorkers: '',
      totalWorkers: '',
      observation: '',
    },
  });

  const location = watch('location');

  const onSubmit = (data: DocumentFormData) => console.log(data);

  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Document Form</Text>

      <LocationScanner
        control={control}
        setValue={setValue}
        errors={errors}
        location={location as string}
      />

      <Controller
        control={control}
        rules={{
          required: 'Number of employees is required',
          pattern: {
            value: /^[0-9]*$/,
            message: 'Only numbers are allowed',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Number of employees on site"
            value={value}
            keyboardType="numeric"
          />
        )}
        name="noOfEmployee"
      />
      {errors.noOfEmployee && <Text style={styles.errorText}>{errors.noOfEmployee.message}</Text>}

      <Controller
        control={control}
        rules={{
          required: 'Company is required',
        }}
        render={({ field: { value, onChange } }) => (
          <View>
            <Text>Select Company</Text>
            <View style={styles.radioGroup}>
              <RadioButton
                value="UNOPS"
                status={value === 'UNOPS' ? 'checked' : 'unchecked'}
                onPress={() => onChange('UNOPS')}
              />
              <Text>UNOPS</Text>
              <RadioButton
                value="Contractor"
                status={value === 'Contractor' ? 'checked' : 'unchecked'}
                onPress={() => onChange('Contractor')}
              />
              <Text>Contractor</Text>
            </View>
          </View>
        )}
        name="company"
      />
      {errors.company && <Text style={styles.errorText}>{errors.company.message}</Text>}

      <Controller
        control={control}
        rules={{
          required: 'Reporting date is required',
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <DatePickerInput
              locale="en"
              label="Reporting Date"
              onBlur={onBlur}
              value={value}
              onChange={onChange}
              inputMode="start"
            />
          </View>
        )}
        name="reportingDate"
      />
      {errors.reportingDate && <Text style={styles.errorText}>{errors.reportingDate.message}</Text>}

      <Controller
        control={control}
        rules={{
          required: 'Daily working hours are required',
          pattern: {
            value: /^[0-9]*$/,
            message: 'Only numbers are allowed',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Daily Working Hours"
            value={value}
            keyboardType="numeric"
          />
        )}
        name="dailyWorkingHours"
      />
      {errors.dailyWorkingHours && (
        <Text style={styles.errorText}>{errors.dailyWorkingHours.message}</Text>
      )}

      <Controller
        control={control}
        rules={{
          required: 'Number of male workers is required',
          pattern: {
            value: /^[0-9]*$/,
            message: 'Only numbers are allowed',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Number of Male Workers"
            value={value}
            keyboardType="numeric"
          />
        )}
        name="noOfMaleWorkers"
      />
      {errors.noOfMaleWorkers && (
        <Text style={styles.errorText}>{errors.noOfMaleWorkers.message}</Text>
      )}

      <Controller
        control={control}
        rules={{
          required: 'Total number of workers is required',
          pattern: {
            value: /^[0-9]*$/,
            message: 'Only numbers are allowed',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Total Workers"
            value={value}
            keyboardType="numeric"
          />
        )}
        name="totalWorkers"
      />
      {errors.totalWorkers && <Text style={styles.errorText}>{errors.totalWorkers.message}</Text>}

      <Controller
        control={control}
        render={({ field: { value, onChange } }) => (
          <View>
            <Text>Observation</Text>
            <View style={styles.radioGroup}>
              <RadioButton
                value="Satisfactory"
                status={value === 'Satisfactory' ? 'checked' : 'unchecked'}
                onPress={() => onChange('Satisfactory')}
              />
              <Text>Satisfactory</Text>
              <RadioButton
                value="Needs Improvement"
                status={value === 'Needs Improvement' ? 'checked' : 'unchecked'}
                onPress={() => onChange('Needs Improvement')}
              />
              <Text>Needs Improvement</Text>
            </View>
          </View>
        )}
        name="observation"
      />
      {errors.observation && <Text style={styles.errorText}>{errors.observation.message}</Text>}

      <Button onPress={handleSubmit(onSubmit)}>Submit</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    gap: 6,
    padding: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
});

export default DocumentForm;
