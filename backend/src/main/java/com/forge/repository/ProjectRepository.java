package com.forge.repository;

import com.forge.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByWorkspaceIdOrderByCreatedAtAsc(UUID workspaceId);
        // JOIN FETCH loads the workspace in the same query, avoiding a
    // LazyInitializationException when the caller needs project.getWorkspace()
    // after the request-scoped Hibernate session has closed (open-in-view: false).
    @Query("SELECT p FROM Project p JOIN FETCH p.workspace WHERE p.id = :projectId")
    Optional<Project> findByIdWithWorkspace(@Param("projectId") UUID projectId);
}