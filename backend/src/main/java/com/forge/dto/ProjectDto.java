package com.forge.dto;

import com.forge.model.Project;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.UUID;

public class ProjectDto {

    public record Response(
        UUID id,
        UUID workspaceId,
        String name,
        Instant createdAt
    ) {
        public static Response from(Project project) {
            return new Response(
                project.getId(),
                project.getWorkspace().getId(),
                project.getName(),
                project.getCreatedAt()
            );
        }
    }

    public record CreateRequest(
        @NotBlank String name
    ) {}

    public record UpdateRequest(
        @NotBlank String name
    ) {}
}