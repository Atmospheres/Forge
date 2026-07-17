import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});
type FormValues = z.infer<typeof schema>;

export function CreateNameForm({
  placeholder,
  onCreate,
}: {
  placeholder: string;
  onCreate: (name: string) => Promise<unknown>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await onCreate(values.name);
    reset();
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex items-start gap-2">
      <div>
        <input
          {...register('name')}
          placeholder={placeholder}
          className="rounded border px-3 py-2"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
