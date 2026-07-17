package com.forge.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Like {@code @NotBlank}, but treats a missing (null) value as valid instead of
 * rejecting it — for partial-update DTO fields where omitting the field means
 * "don't change this," but sending it means it must be a real value.
 */
@Target({ ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NullOrNotBlankValidator.class)
public @interface NullOrNotBlank {
    String message() default "must not be blank";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
