package com.forge.dto;

import com.forge.model.UserPreferences;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class UserPreferencesDto {

    public record Response(String theme) {
        public static Response from(UserPreferences preferences) {
            return new Response(preferences.getTheme());
        }

        public static Response defaultValue() {
            return new Response("light");
        }
    }

    public record UpdateRequest(
        @NotNull @Pattern(regexp = "light|dark", message = "must be 'light' or 'dark'") String theme
    ) {}
}
